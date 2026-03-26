import { LoginRepository } from "./login.repository";
import {
  DatabaseError,
  InvalidCredentialsError,
  LoginError,
  LoginResult,
  UnknownError,
} from "../../types/login.types";
import { VerifyLocalCredentialUseCase } from "@/feature/session/useCase/verifyLocalCredential.useCase";
import { AuthSessionErrorType } from "@/feature/session/types/authSession.types";

export const createLocalLoginRepository = (
  verifyLocalCredentialUseCase: VerifyLocalCredentialUseCase,
): LoginRepository => ({
  async loginWithEmail(payload): Promise<LoginResult> {
    const result = await verifyLocalCredentialUseCase.execute({
      loginId: payload.email.trim().toLowerCase(),
      password: payload.password,
    });

    if (result.success) {
      return {
        success: true,
        value: result.value,
      };
    }

    return {
      success: false,
      error: mapAuthSessionErrorToLoginError(result.error),
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

    if (typedError.type === AuthSessionErrorType.DatabaseError) {
      return {
        ...DatabaseError,
        message: typedError.message,
      };
    }

    if (typedError.type === AuthSessionErrorType.ValidationError) {
      return {
        type: "VALIDATION_ERROR",
        message: typedError.message,
      };
    }

    return {
      ...UnknownError,
      message: typedError.message,
    };
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
    return {
      ...DatabaseError,
      message: error.message,
    };
  }

  return {
    ...UnknownError,
    message: error.message,
  };
};
