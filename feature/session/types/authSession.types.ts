import { Result } from "@/shared/types/result.types";

export const CredentialType = {
  Password: "password",
  Pin: "pin",
} as const;

export type CredentialTypeValue =
  (typeof CredentialType)[keyof typeof CredentialType];

export const RecordSyncStatus = {
  PendingCreate: "pending_create",
  PendingUpdate: "pending_update",
  PendingDelete: "pending_delete",
  Synced: "synced",
  Failed: "failed",
} as const;

export type RecordSyncStatusValue =
  (typeof RecordSyncStatus)[keyof typeof RecordSyncStatus];

export type SaveAuthUserPayload = {
  remoteId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  authProvider: string | null;
  profileImageUrl: string | null;
  preferredLanguage: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
};

export type SaveAuthCredentialPayload = {
  remoteId: string;
  userRemoteId: string;
  loginId: string;
  credentialType: CredentialTypeValue;
  passwordHash: string;
  passwordSalt: string;
  hint: string | null;
  isActive: boolean;
};

export type VerifyLocalCredentialPayload = {
  loginId: string;
  password: string;
};

export type AuthUser = {
  remoteId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  authProvider: string | null;
  profileImageUrl: string | null;
  preferredLanguage: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: number;
  updatedAt: number;
};

export type AuthCredential = {
  remoteId: string;
  userRemoteId: string;
  loginId: string;
  credentialType: CredentialTypeValue;
  passwordHash: string;
  passwordSalt: string;
  hint: string | null;
  lastLoginAt: number | null;
  isActive: boolean;
  failedAttemptCount: number;
  lockoutUntil: number | null;
  lastFailedLoginAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type VerifiedLocalCredential = {
  authUser: AuthUser;
  authCredential: AuthCredential;
};

export const AuthSessionErrorType = {
  DatabaseError: "DATABASE_ERROR",
  ValidationError: "VALIDATION_ERROR",
  InvalidCredentials: "INVALID_CREDENTIALS",
  TooManyAttempts: "TOO_MANY_ATTEMPTS",
  AuthUserNotFound: "AUTH_USER_NOT_FOUND",
  AuthCredentialNotFound: "AUTH_CREDENTIAL_NOT_FOUND",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type AuthSessionError = {
  type: (typeof AuthSessionErrorType)[keyof typeof AuthSessionErrorType];
  message: string;
};

export const AuthSessionDatabaseError: AuthSessionError = {
  type: AuthSessionErrorType.DatabaseError,
  message: "Unable to process your request right now. Please try again.",
};

export const AuthSessionValidationError = (
  message: string,
): AuthSessionError => ({
  type: AuthSessionErrorType.ValidationError,
  message,
});

export const InvalidCredentialsError: AuthSessionError = {
  type: AuthSessionErrorType.InvalidCredentials,
  message: "Invalid phone number or password.",
};

export const TooManyAttemptsError = (): AuthSessionError => ({
  type: AuthSessionErrorType.TooManyAttempts,
  message: "Too many failed attempts. Please try again later.",
});

export const AuthUserNotFoundError: AuthSessionError = {
  type: AuthSessionErrorType.AuthUserNotFound,
  message: "The requested auth user was not found.",
};

export const AuthCredentialNotFoundError: AuthSessionError = {
  type: AuthSessionErrorType.AuthCredentialNotFound,
  message: "The requested auth credential was not found.",
};

export const AuthSessionUnknownError: AuthSessionError = {
  type: AuthSessionErrorType.UnknownError,
  message: "An unexpected error occurred.",
};

export type AuthUserResult = Result<AuthUser, AuthSessionError>;
export type AuthUsersResult = Result<AuthUser[], AuthSessionError>;
export type AuthCredentialResult = Result<AuthCredential, AuthSessionError>;
export type VerifiedLocalCredentialResult = Result<
  VerifiedLocalCredential,
  AuthSessionError
>;
export type AuthOperationResult = Result<boolean, AuthSessionError>;
