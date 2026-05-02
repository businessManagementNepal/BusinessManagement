export const SyncErrorType = {
  Validation: "VALIDATION",
  Database: "DATABASE",
  Remote: "REMOTE",
  Conflict: "CONFLICT",
  Locked: "LOCKED",
  Unknown: "UNKNOWN",
} as const;

export type SyncError = {
  type: (typeof SyncErrorType)[keyof typeof SyncErrorType];
  message: string;
};

export const SyncValidationError = (message: string): SyncError => ({
  type: SyncErrorType.Validation,
  message,
});

export const SyncDatabaseError = (message: string): SyncError => ({
  type: SyncErrorType.Database,
  message,
});

export const SyncRemoteError = (message: string): SyncError => ({
  type: SyncErrorType.Remote,
  message,
});

export const SyncConflictError = (message: string): SyncError => ({
  type: SyncErrorType.Conflict,
  message,
});

export const SyncLockedError = (message: string): SyncError => ({
  type: SyncErrorType.Locked,
  message,
});

export const SyncUnknownError = (message: string): SyncError => ({
  type: SyncErrorType.Unknown,
  message,
});
