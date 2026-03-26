import { PasswordHashService } from "@/shared/utils/auth/passwordHash.service";
import { AuthCredentialRepository } from "../data/repository/authCredential.repository";
import { AuthUserRepository } from "../data/repository/authUser.repository";
import {
  AuthSessionErrorType,
  AuthSessionValidationError,
  InvalidCredentialsError,
  VerifiedLocalCredentialResult,
  VerifyLocalCredentialPayload,
} from "../types/authSession.types";
import { VerifyLocalCredentialUseCase } from "./verifyLocalCredential.useCase";

export const createVerifyLocalCredentialUseCase = (
  authCredentialRepository: AuthCredentialRepository,
  authUserRepository: AuthUserRepository,
  passwordHashService: PasswordHashService,
): VerifyLocalCredentialUseCase => ({
  async execute(
    payload: VerifyLocalCredentialPayload,
  ): Promise<VerifiedLocalCredentialResult> {
    const normalizedLoginId = payload.loginId.trim().toLowerCase();
    const password = payload.password.trim();

    if (!normalizedLoginId) {
      return {
        success: false,
        error: AuthSessionValidationError("Email is required."),
      };
    }

    if (!password) {
      return {
        success: false,
        error: AuthSessionValidationError("Password is required."),
      };
    }

    const authCredentialResult =
      await authCredentialRepository.getActiveAuthCredentialByLoginId(
        normalizedLoginId,
      );

    if (!authCredentialResult.success) {
      if (
        authCredentialResult.error.type ===
        AuthSessionErrorType.AuthCredentialNotFound
      ) {
        return {
          success: false,
          error: InvalidCredentialsError,
        };
      }

      return authCredentialResult;
    }

    const authCredential = authCredentialResult.value;

    const isPasswordValid = await passwordHashService.compare(
      password,
      authCredential.passwordSalt,
      authCredential.passwordHash,
    );

    if (!isPasswordValid) {
      return {
        success: false,
        error: InvalidCredentialsError,
      };
    }

    const authUserResult = await authUserRepository.getAuthUserByRemoteId(
      authCredential.userRemoteId,
    );

    if (!authUserResult.success) {
      return authUserResult;
    }

    return {
      success: true,
      value: {
        authUser: authUserResult.value,
        authCredential,
      },
    };
  },
});