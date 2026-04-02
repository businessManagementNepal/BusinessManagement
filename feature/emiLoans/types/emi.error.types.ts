export const EmiErrorType = {
  DatabaseError: "DATABASE_ERROR",
  ValidationError: "VALIDATION_ERROR",
  PlanNotFound: "PLAN_NOT_FOUND",
  InstallmentNotFound: "INSTALLMENT_NOT_FOUND",
  AlreadyPaid: "ALREADY_PAID",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type EmiError = {
  type: (typeof EmiErrorType)[keyof typeof EmiErrorType];
  message: string;
};

export const EmiDatabaseError: EmiError = {
  type: EmiErrorType.DatabaseError,
  message: "Unable to process EMI data right now.",
};

export const EmiPlanNotFoundError: EmiError = {
  type: EmiErrorType.PlanNotFound,
  message: "The selected plan was not found.",
};

export const EmiInstallmentNotFoundError: EmiError = {
  type: EmiErrorType.InstallmentNotFound,
  message: "The selected installment was not found.",
};

export const EmiAlreadyPaidError: EmiError = {
  type: EmiErrorType.AlreadyPaid,
  message: "This installment is already completed.",
};

export const EmiUnknownError: EmiError = {
  type: EmiErrorType.UnknownError,
  message: "An unexpected EMI error occurred.",
};

export const EmiValidationError = (message: string): EmiError => ({
  type: EmiErrorType.ValidationError,
  message,
});
