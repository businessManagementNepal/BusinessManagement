export const LedgerErrorType = {
  DatabaseError: "DATABASE_ERROR",
  ValidationError: "VALIDATION_ERROR",
  LedgerEntryNotFound: "LEDGER_ENTRY_NOT_FOUND",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type LedgerError = {
  type: (typeof LedgerErrorType)[keyof typeof LedgerErrorType];
  message: string;
};

export const LedgerDatabaseError: LedgerError = {
  type: LedgerErrorType.DatabaseError,
  message: "Unable to process ledger data right now. Please try again.",
};

export const LedgerValidationError = (message: string): LedgerError => ({
  type: LedgerErrorType.ValidationError,
  message,
});

export const LedgerEntryNotFoundError: LedgerError = {
  type: LedgerErrorType.LedgerEntryNotFound,
  message: "The selected ledger entry was not found.",
};

export const LedgerUnknownError: LedgerError = {
  type: LedgerErrorType.UnknownError,
  message: "An unexpected ledger error occurred.",
};
