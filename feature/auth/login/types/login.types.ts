import { VerifiedLocalCredential } from "@/feature/session/types/authSession.types";
import { Result } from "@/shared/types/result.types";
import { Status } from "@/shared/types/status.types";

export const LoginErrorType = {
  ValidationError: "VALIDATION_ERROR",
  InvalidCredentials: "INVALID_CREDENTIALS",
  TooManyAttempts: "TOO_MANY_ATTEMPTS",
  DatabaseError: "DATABASE_ERROR",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type LoginError = {
  type: (typeof LoginErrorType)[keyof typeof LoginErrorType];
  message: string;
};

export const ValidationError = (message: string): LoginError => ({
  type: LoginErrorType.ValidationError,
  message,
});

export const InvalidCredentialsError: LoginError = {
  type: LoginErrorType.InvalidCredentials,
  message: "Invalid email or password.",
};

export const TooManyAttemptsError: LoginError = {
  type: LoginErrorType.TooManyAttempts,
  message: "Too many failed attempts. Please try again later.",
};

export const DatabaseError: LoginError = {
  type: LoginErrorType.DatabaseError,
  message: "Unable to process your request right now. Please try again.",
};

export const UnknownError: LoginError = {
  type: LoginErrorType.UnknownError,
  message: "An unexpected error occurred.",
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = Result<VerifiedLocalCredential, LoginError>;

export type LoginState =
  | { status: typeof Status.Idle }
  | { status: typeof Status.Loading }
  | { status: typeof Status.Success }
  | { status: typeof Status.Failure; error: string };