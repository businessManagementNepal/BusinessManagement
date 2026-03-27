import { VerifyLocalCredentialUseCase } from "@/feature/session/useCase/verifyLocalCredential.useCase";
import {
  AuthSessionErrorType,
  VerifiedLocalCredential,
} from "@/feature/session/types/authSession.types";
import { normalizePhoneNumber } from "@/shared/utils/auth/phoneNumber.util";
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

type LocalLoginRepositoryOptions = {
  onAuthenticated?: (
    verifiedCredential: VerifiedLocalCredential,
  ) => Promise<void> | void;
};

export const createLocalLoginRepository = (
  verifyLocalCredentialUseCase: VerifyLocalCredentialUseCase,
  options: LocalLoginRepositoryOptions = {},
): LoginRepository => ({
  async loginWithEmail(payload): Promise<LoginResult> {
    const loginIdCandidates = buildLoginIdCandidates(payload.phoneNumber);
    let verifiedCredential: VerifiedLocalCredential | null = null;
    let lastError: { type: string; message: string } | Error | unknown = null;

    for (const loginId of loginIdCandidates) {
      const verificationResult = await verifyLocalCredentialUseCase.execute({
        loginId,
        password: payload.password,
      });

      if (verificationResult.success) {
        verifiedCredential = verificationResult.value;
        break;
      }

      lastError = verificationResult.error;

      if (
        verificationResult.error.type !==
        AuthSessionErrorType.AuthCredentialNotFound
      ) {
        return {
          success: false,
          error: mapAuthSessionErrorToLoginError(verificationResult.error),
        };
      }
    }

    if (!verifiedCredential) {
      return {
        success: false,
        error: mapAuthSessionErrorToLoginError(lastError),
      };
    }

    try {
      if (options.onAuthenticated) {
        await options.onAuthenticated(verifiedCredential);
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

const buildLoginIdCandidates = (phoneNumber: string): string[] => {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedPhoneNumber) {
    return [phoneNumber];
  }

  if (normalizedPhoneNumber.startsWith("+")) {
    return [normalizedPhoneNumber];
  }

  const loginIdCandidates = new Set<string>([normalizedPhoneNumber]);
  loginIdCandidates.add(`+977${normalizedPhoneNumber}`);
  loginIdCandidates.add(`+91${normalizedPhoneNumber}`);

  return Array.from(loginIdCandidates);
};

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
