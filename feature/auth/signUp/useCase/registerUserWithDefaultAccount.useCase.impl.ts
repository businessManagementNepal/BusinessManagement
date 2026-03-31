import * as Crypto from "expo-crypto";
import { PasswordHashService } from "@/shared/utils/auth/passwordHash.service";
import { GetActiveAuthCredentialByLoginIdUseCase } from "@/feature/session/useCase/getActiveAuthCredentialByLoginId.useCase";
import { SaveAuthCredentialUseCase } from "@/feature/session/useCase/saveAuthCredential.useCase";
import { SaveAuthUserUseCase } from "@/feature/session/useCase/saveAuthUser.useCase";
import { AuthCredentialRepository } from "@/feature/session/data/repository/authCredential.repository";
import { AuthUserRepository } from "@/feature/session/data/repository/authUser.repository";
import {
  AuthSessionErrorType,
  CredentialType,
  VerifiedLocalCredential,
} from "@/feature/session/types/authSession.types";
import { SaveAccountUseCase } from "@/feature/setting/accounts/accountSelection/useCase/saveAccount.useCase";
import {
  DatabaseError,
  PhoneNumberAlreadyInUseError,
  SignUpError,
  SignUpInput,
  SignUpResult,
  SignUpProfileType,
  ValidationError,
  UnknownError,
} from "../types/signUp.types";
import { RegisterUserWithDefaultAccountUseCase } from "./registerUserWithDefaultAccount.useCase";

type CreateRegisterUserWithDefaultAccountUseCaseParams = {
  getActiveAuthCredentialByLoginIdUseCase: GetActiveAuthCredentialByLoginIdUseCase;
  saveAuthUserUseCase: SaveAuthUserUseCase;
  saveAuthCredentialUseCase: SaveAuthCredentialUseCase;
  saveAccountUseCase: SaveAccountUseCase;
  authUserRepository: AuthUserRepository;
  authCredentialRepository: AuthCredentialRepository;
  passwordHashService: PasswordHashService;
};

const mapAuthSessionErrorToSignUpError = (
  error: { type: string; message: string } | Error | unknown,
): SignUpError => {
  if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    "message" in error
  ) {
    const typedError = error as { type: string; message: string };

    if (typedError.type === AuthSessionErrorType.ValidationError) {
      return ValidationError(typedError.message);
    }

    if (typedError.type === AuthSessionErrorType.DatabaseError) {
      return DatabaseError;
    }

    return UnknownError;
  }

  if (!(error instanceof Error)) {
    return UnknownError;
  }

  const message = error.message.toLowerCase();

  const isDatabaseError =
    message.includes("table") ||
    message.includes("schema") ||
    message.includes("database") ||
    message.includes("adapter") ||
    message.includes("timeout");

  if (isDatabaseError) {
    return DatabaseError;
  }

  return UnknownError;
};

const createRollbackError = (reason: string): SignUpError => ({
  ...DatabaseError,
  message: reason,
});

const rollbackPartialRegistration = async (
  authCredentialRepository: AuthCredentialRepository,
  authUserRepository: AuthUserRepository,
  createdCredentialRemoteId: string | null,
  createdUserRemoteId: string | null,
): Promise<string[]> => {
  const rollbackErrors: string[] = [];

  if (createdCredentialRemoteId) {
    const rollbackCredentialResult =
      await authCredentialRepository.deleteAuthCredentialByRemoteId(
        createdCredentialRemoteId,
      );

    if (!rollbackCredentialResult.success) {
      rollbackErrors.push(rollbackCredentialResult.error.message);
    }
  }

  if (createdUserRemoteId) {
    const rollbackAuthUserResult =
      await authUserRepository.deleteAuthUserByRemoteId(createdUserRemoteId);

    if (!rollbackAuthUserResult.success) {
      rollbackErrors.push(rollbackAuthUserResult.error.message);
    }
  }

  return rollbackErrors;
};

export const createRegisterUserWithDefaultAccountUseCase = (
  params: CreateRegisterUserWithDefaultAccountUseCaseParams,
): RegisterUserWithDefaultAccountUseCase => {
  const {
    getActiveAuthCredentialByLoginIdUseCase,
    saveAuthUserUseCase,
    saveAuthCredentialUseCase,
    saveAccountUseCase,
    authUserRepository,
    authCredentialRepository,
    passwordHashService,
  } = params;

  return {
    async execute(payload: SignUpInput): Promise<SignUpResult> {
      const existingCredentialResult =
        await getActiveAuthCredentialByLoginIdUseCase.execute(
          payload.phoneNumber,
          CredentialType.Password,
        );

      if (existingCredentialResult.success) {
        return {
          success: false,
          error: PhoneNumberAlreadyInUseError,
        };
      }

      if (
        existingCredentialResult.error.type !==
        AuthSessionErrorType.AuthCredentialNotFound
      ) {
        return {
          success: false,
          error: mapAuthSessionErrorToSignUpError(existingCredentialResult.error),
        };
      }

      let passwordSalt: string;
      let passwordHash: string;

      try {
        passwordSalt = await passwordHashService.generateSalt();
        passwordHash = await passwordHashService.hash(
          payload.password,
          passwordSalt,
        );
      } catch (error) {
        console.error("Failed to hash password during registration.", error);
        return {
          success: false,
          error: UnknownError,
        };
      }

      const userRemoteId = Crypto.randomUUID();
      const credentialRemoteId = Crypto.randomUUID();
      const defaultAccountRemoteId = Crypto.randomUUID();
      let createdUserRemoteId: string | null = null;
      let createdCredentialRemoteId: string | null = null;

      const saveAuthUserResult = await saveAuthUserUseCase.execute({
        remoteId: userRemoteId,
        fullName: payload.fullName,
        email: null,
        phone: payload.phoneNumber,
        authProvider: null,
        profileImageUrl: null,
        preferredLanguage: null,
        isEmailVerified: false,
        isPhoneVerified: false,
      });

      if (!saveAuthUserResult.success) {
        return {
          success: false,
          error: mapAuthSessionErrorToSignUpError(saveAuthUserResult.error),
        };
      }

      createdUserRemoteId = saveAuthUserResult.value.remoteId;

      const saveAuthCredentialResult = await saveAuthCredentialUseCase.execute({
        remoteId: credentialRemoteId,
        userRemoteId,
        loginId: payload.phoneNumber,
        credentialType: CredentialType.Password,
        passwordHash,
        passwordSalt,
        hint: null,
        isActive: true,
      });

      if (!saveAuthCredentialResult.success) {
        const rollbackErrors = await rollbackPartialRegistration(
          authCredentialRepository,
          authUserRepository,
          createdCredentialRemoteId,
          createdUserRemoteId,
        );

        if (rollbackErrors.length > 0) {
          return {
            success: false,
            error: createRollbackError(
              `Registration failed and rollback was incomplete: ${rollbackErrors.join(
                "; ",
              )}`,
            ),
          };
        }

        return {
          success: false,
          error: mapAuthSessionErrorToSignUpError(saveAuthCredentialResult.error),
        };
      }

      createdCredentialRemoteId = saveAuthCredentialResult.value.remoteId;

      const saveAccountResult = await saveAccountUseCase.execute({
        remoteId: defaultAccountRemoteId,
        ownerUserRemoteId: userRemoteId,
        accountType: payload.profileType,
        businessType:
          payload.profileType === SignUpProfileType.Business
            ? payload.businessType
            : null,
        displayName: payload.fullName,
        currencyCode: null,
        cityOrLocation: null,
        countryCode: null,
        isActive: true,
        isDefault: true,
      });

      if (!saveAccountResult.success) {
        const rollbackErrors = await rollbackPartialRegistration(
          authCredentialRepository,
          authUserRepository,
          createdCredentialRemoteId,
          createdUserRemoteId,
        );

        if (rollbackErrors.length > 0) {
          return {
            success: false,
            error: createRollbackError(
              `Registration failed and rollback was incomplete: ${rollbackErrors.join(
                "; ",
              )}`,
            ),
          };
        }

        return {
          success: false,
          error: mapAuthSessionErrorToSignUpError(saveAccountResult.error),
        };
      }

      const verifiedCredential: VerifiedLocalCredential = {
        authUser: saveAuthUserResult.value,
        authCredential: saveAuthCredentialResult.value,
      };

      return {
        success: true,
        value: verifiedCredential,
      };
    },
  };
};
