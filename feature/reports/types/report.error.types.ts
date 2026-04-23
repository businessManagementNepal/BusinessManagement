export const ReportErrorType = {
  ValidationError: "VALIDATION_ERROR",
  DatabaseError: "DATABASE_ERROR",
  ReportNotFound: "REPORT_NOT_FOUND",
  ExportError: "EXPORT_ERROR",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type ReportError = {
  type: (typeof ReportErrorType)[keyof typeof ReportErrorType];
  message: string;
};

export const ReportValidationError = (message: string): ReportError => ({
  type: ReportErrorType.ValidationError,
  message,
});

export const ReportDatabaseError: ReportError = {
  type: ReportErrorType.DatabaseError,
  message: "Unable to load reports right now. Please try again.",
};

export const ReportNotFoundError: ReportError = {
  type: ReportErrorType.ReportNotFound,
  message: "The requested report was not found.",
};

export const ReportExportError = (message: string): ReportError => ({
  type: ReportErrorType.ExportError,
  message,
});

export const ReportUnknownError: ReportError = {
  type: ReportErrorType.UnknownError,
  message: "An unexpected report error occurred.",
};
