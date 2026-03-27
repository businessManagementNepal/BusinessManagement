import * as Crypto from "expo-crypto";
import { PasswordHashService } from "@/shared/utils/auth/passwordHash.service";
import { GetActiveAuthCredentialByLoginIdUseCase } from "@/feature/session/useCase/getActiveAuthCredentialByLoginId.useCase";
import { SaveAuthCredentialUseCase } from "@/feature/session/useCase/saveAuthCredential.useCase";
import { SaveAuthUserUseCase } from "@/feature/session/useCase/saveAuthUser.useCase";
import {
  AuthSessionErrorType,
  CredentialType,
  VerifiedLocalCredential,
} from "@/feature/session/types/authSession.types";
import { SignUpRepository } from "./signUp.repository";
import {
  DatabaseError,
  PhoneNumberAlreadyInUseError,
  SignUpError,
  SignUpResult,
  UnknownError,
  ValidationError,
} from "../../types/signUp.types";

type LocalSignUpRepositoryOptions = {
  onRegistered?: (
    verifiedCredential: VerifiedLocalCredential,
  ) => Promise<void> | void;
};

export const createLocalSignUpRepository = (
  getActiveAuthCredentialByLoginIdUseCase: GetActiveAuthCredentialByLoginIdUseCase,
  saveAuthUserUseCase: SaveAuthUserUseCase,
  saveAuthCredentialUseCase: SaveAuthCredentialUseCase,
  passwordHashService: PasswordHashService,
  options: LocalSignUpRepositoryOptions = {},
): SignUpRepository => ({
  async signUpWithEmail(payload): Promise<SignUpResult> {
    const fullName = payload.fullName;
    const phoneNumber = payload.phoneNumber;
    const password = payload.password;

    const existingCredentialResult =
      await getActiveAuthCredentialByLoginIdUseCase.execute(
        phoneNumber,
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

    const userRemoteId = Crypto.randomUUID();
    const credentialRemoteId = Crypto.randomUUID();

    const passwordHashTask = (async (): Promise<{
      passwordSalt: string;
      passwordHash: string;
    }> => {
      const passwordSalt = await passwordHashService.generateSalt();
      const passwordHash = await passwordHashService.hash(password, passwordSalt);

      return { passwordSalt, passwordHash };
    })();

    const saveAuthUserResult = await saveAuthUserUseCase.execute({
      remoteId: userRemoteId,
      fullName,
      email: null,
      phone: phoneNumber,
      authProvider: null,
      profileImageUrl: null,
      preferredLanguage: null,
      isEmailVerified: false,
      isPhoneVerified: false,
    });

    if (!saveAuthUserResult.success) {
      void passwordHashTask.catch(() => undefined);

      return {
        success: false,
        error: mapAuthSessionErrorToSignUpError(saveAuthUserResult.error),
      };
    }

    let passwordSalt: string;
    let passwordHash: string;

    try {
      const passwordCredential = await passwordHashTask;
      passwordSalt = passwordCredential.passwordSalt;
      passwordHash = passwordCredential.passwordHash;
    } catch {
      return {
        success: false,
        error: UnknownError,
      };
    }

    const saveAuthCredentialResult = await saveAuthCredentialUseCase.execute({
      remoteId: credentialRemoteId,
      userRemoteId,
      loginId: phoneNumber,
      credentialType: CredentialType.Password,
      passwordHash,
      passwordSalt,
      hint: null,
      isActive: true,
    });

    if (!saveAuthCredentialResult.success) {
      return {
        success: false,
        error: mapAuthSessionErrorToSignUpError(saveAuthCredentialResult.error),
      };
    }

    const verifiedCredential: VerifiedLocalCredential = {
      authUser: saveAuthUserResult.value,
      authCredential: saveAuthCredentialResult.value,
    };

    try {
      if (options.onRegistered) {
        await options.onRegistered(verifiedCredential);
      }
    } catch {
      return {
        success: false,
        error: DatabaseError,
      };
    }

    return {
      success: true,
      value: verifiedCredential,
    };
  },
});

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

    if (
      typedError.type === AuthSessionErrorType.ValidationError ||
      typedError.type === AuthSessionErrorType.AuthCredentialNotFound
    ) {
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
