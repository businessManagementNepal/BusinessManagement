import { PasswordHashService } from "@/shared/utils/auth/passwordHash.service";
import { AuthCredentialRepository } from "../data/repository/authCredential.repository";
import { AuthUserRepository } from "../data/repository/authUser.repository";
import {
  AuthSessionErrorType,
  AuthSessionValidationError,
  CredentialType,
  InvalidCredentialsError,
  TooManyAttemptsError,
  VerifiedLocalCredentialResult,
  VerifyLocalCredentialPayload,
} from "../types/authSession.types";
import { VerifyLocalCredentialUseCase } from "./verifyLocalCredential.useCase";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

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
        error: AuthSessionValidationError("Phone number is required."),
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
        CredentialType.Password,
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

    if (
      authCredential.lockoutUntil !== null &&
      authCredential.lockoutUntil > Date.now()
    ) {
      return {
        success: false,
        error: TooManyAttemptsError(),
      };
    }

    const isPasswordValid = await passwordHashService.compare(
      password,
      authCredential.passwordSalt,
      authCredential.passwordHash,
    );

    if (!isPasswordValid) {
      const failedAttemptResult =
        await authCredentialRepository.recordFailedLoginAttemptByRemoteId(
          authCredential.remoteId,
          MAX_FAILED_ATTEMPTS,
          LOCKOUT_DURATION_MS,
        );

      if (!failedAttemptResult.success) {
        return failedAttemptResult;
      }

      const updatedCredential = failedAttemptResult.value;

      if (
        updatedCredential.lockoutUntil !== null &&
        updatedCredential.lockoutUntil > Date.now()
      ) {
        return {
          success: false,
          error: TooManyAttemptsError(),
        };
      }

      return {
        success: false,
        error: InvalidCredentialsError,
      };
    }

    const [markLoginSuccessResult, authUserResult] = await Promise.all([
      authCredentialRepository.markLoginSuccessByRemoteId(authCredential.remoteId),
      authUserRepository.getAuthUserByRemoteId(authCredential.userRemoteId),
    ]);

    if (!markLoginSuccessResult.success) {
      return markLoginSuccessResult;
    }

    if (!authUserResult.success) {
      return authUserResult;
    }

    if (passwordHashService.needsRehash(authCredential.passwordHash)) {
      void (async () => {
        try {
          const nextPasswordHash = await passwordHashService.hash(
            password,
            authCredential.passwordSalt,
          );

          await authCredentialRepository.saveAuthCredential({
            remoteId: authCredential.remoteId,
            userRemoteId: authCredential.userRemoteId,
            loginId: authCredential.loginId,
            credentialType: authCredential.credentialType,
            passwordHash: nextPasswordHash,
            passwordSalt: authCredential.passwordSalt,
            hint: authCredential.hint,
            isActive: authCredential.isActive,
          });
        } catch {
          // Keep login successful even if background rehash fails.
        }
      })();
    }

    return {
      success: true,
      value: {
        authUser: authUserResult.value,
        authCredential: {
          ...authCredential,
          lastLoginAt: Date.now(),
          failedAttemptCount: 0,
          lockoutUntil: null,
          lastFailedLoginAt: null,
        },
      },
    };
  },
});
