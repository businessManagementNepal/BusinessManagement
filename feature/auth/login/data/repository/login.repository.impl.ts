import { VerifyLocalCredentialUseCase } from "@/feature/session/useCase/verifyLocalCredential.useCase";
import {
  AuthSessionErrorType,
  VerifiedLocalCredential,
} from "@/feature/session/types/authSession.types";
import { LoginInput } from "../../types/login.types";
import { LoginRepository } from "./login.repository";
import {
  DatabaseError,
  InvalidCredentialsError,
  LoginError,
  LoginResult,
  TooManyAttemptsError,
  UnknownError,
  ValidationError,
} from "../../types/login.types";
import { buildPhoneLoginIdCandidates } from "@/shared/utils/auth/phoneNumber.util";

type LocalLoginRepositoryOptions = {
  onAuthenticated: (
    verifiedCredential: VerifiedLocalCredential,
    payload: LoginInput,
  ) => Promise<void> | void;
};

export const createLocalLoginRepository = (
  verifyLocalCredentialUseCase: VerifyLocalCredentialUseCase,
  options: LocalLoginRepositoryOptions,
): LoginRepository => ({
  async loginWithEmail(payload): Promise<LoginResult> {
    const loginIdCandidates = buildPhoneLoginIdCandidates(payload.phoneNumber);
    const candidates = loginIdCandidates.length > 0 ? loginIdCandidates : [payload.phoneNumber];
    let lastError: LoginError | null = null;

    for (const loginIdCandidate of candidates) {
      const verificationResult = await verifyLocalCredentialUseCase.execute({
        loginId: loginIdCandidate,
        password: payload.password,
      });

      if (verificationResult.success) {
        try {
          await options.onAuthenticated(verificationResult.value, payload);
        } catch {
          return {
            success: false,
            error: DatabaseError,
          };
        }

        return {
          success: true,
          value: verificationResult.value,
        };
      }

      const mappedError = mapAuthSessionErrorToLoginError(verificationResult.error);

      if (
        verificationResult.error.type === AuthSessionErrorType.AuthCredentialNotFound &&
        loginIdCandidate !== candidates[candidates.length - 1]
      ) {
        lastError = mappedError;
        continue;
      }

      lastError = mappedError;
      break;
    }

    return {
      success: false,
      error: lastError ?? UnknownError,
    };
  },
});

const mapAuthSessionErrorToLoginError = (
  error: { type: string; message: string } | Error | unknown,
): LoginError => {
  if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    "message" in error
  ) {
    const typedError = error as { type: string; message: string };

    if (
      typedError.type === AuthSessionErrorType.InvalidCredentials ||
      typedError.type === AuthSessionErrorType.AuthCredentialNotFound
    ) {
      return InvalidCredentialsError;
    }

    if (typedError.type === AuthSessionErrorType.TooManyAttempts) {
      return TooManyAttemptsError;
    }

    if (typedError.type === AuthSessionErrorType.DatabaseError) {
      return DatabaseError;
    }

    if (typedError.type === AuthSessionErrorType.ValidationError) {
      return ValidationError(typedError.message);
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
