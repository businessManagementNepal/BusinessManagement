import { VerifyLocalCredentialUseCase } from "@/feature/session/useCase/verifyLocalCredential.useCase";
import {
  AuthSessionErrorType,
  VerifiedLocalCredential,
} from "@/feature/session/types/authSession.types";
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

const normalizePhoneNumber = (value: string): string => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  const digits = trimmedValue.replace(/\D/g, "");
  const hasLeadingPlus = trimmedValue.startsWith("+");
  return hasLeadingPlus ? `+${digits}` : digits;
};

export const createLocalLoginRepository = (
  verifyLocalCredentialUseCase: VerifyLocalCredentialUseCase,
  options: LocalLoginRepositoryOptions = {},
): LoginRepository => ({
  async loginWithEmail(payload): Promise<LoginResult> {
    const phoneNumber = normalizePhoneNumber(payload.phoneNumber);

    const result = await verifyLocalCredentialUseCase.execute({
      loginId: phoneNumber,
      password: payload.password,
    });

    if (!result.success) {
      return {
        success: false,
        error: mapAuthSessionErrorToLoginError(result.error),
      };
    }

    try {
      if (options.onAuthenticated) {
        await options.onAuthenticated(result.value);
      }
    } catch {
      return {
        success: false,
        error: DatabaseError,
      };
    }

    return {
      success: true,
      value: result.value,
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
