export const TransactionErrorType = {
  ValidationError: "VALIDATION_ERROR",
  DatabaseError: "DATABASE_ERROR",
  TransactionNotFound: "TRANSACTION_NOT_FOUND",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type TransactionError = {
  type:
    (typeof TransactionErrorType)[keyof typeof TransactionErrorType];
  message: string;
};

export const TransactionValidationError = (
  message: string,
): TransactionError => ({
  type: TransactionErrorType.ValidationError,
  message,
});

export const TransactionDatabaseError: TransactionError = {
  type: TransactionErrorType.DatabaseError,
  message: "Unable to process the transaction right now. Please try again.",
};

export const TransactionNotFoundError: TransactionError = {
  type: TransactionErrorType.TransactionNotFound,
  message: "The requested transaction was not found.",
};

export const TransactionUnknownError: TransactionError = {
  type: TransactionErrorType.UnknownError,
  message: "An unexpected transaction error occurred.",
};
