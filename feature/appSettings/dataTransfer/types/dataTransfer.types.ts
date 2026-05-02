import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { Result } from "@/shared/types/result.types";

export const SettingsDataTransferFormat = {
  Csv: "csv",
  Excel: "xlsx",
  Pdf: "pdf",
  Json: "json",
} as const;

export type SettingsDataTransferFormatValue =
  (typeof SettingsDataTransferFormat)[keyof typeof SettingsDataTransferFormat];

export const ImportFileFormat = {
  Csv: "csv",
  Excel: "xlsx",
  Pdf: "pdf",
} as const;

export type ImportFileFormatValue =
  (typeof ImportFileFormat)[keyof typeof ImportFileFormat];

export const SettingsDataTransferModule = {
  Transactions: "transactions",
  Products: "products",
  Contacts: "contacts",
  Orders: "orders",
  Budgets: "budgets",
  Ledger: "ledger",
  EmiLoans: "emi_loans",
  Accounts: "accounts",
} as const;

export type SettingsDataTransferModuleValue =
  (typeof SettingsDataTransferModule)[keyof typeof SettingsDataTransferModule];

export type SettingsDataTransferModuleOption = {
  id: SettingsDataTransferModuleValue;
  label: string;
  description?: string;
  disabled?: boolean;
  statusLabel?: string;
};

export const SETTINGS_DATA_TRANSFER_MODULE_OPTIONS: readonly SettingsDataTransferModuleOption[] =
  [
    { id: SettingsDataTransferModule.Transactions, label: "Transactions" },
    { id: SettingsDataTransferModule.Products, label: "Products" },
    { id: SettingsDataTransferModule.Contacts, label: "Contacts" },
    { id: SettingsDataTransferModule.Orders, label: "Orders" },
    { id: SettingsDataTransferModule.Budgets, label: "Budgets" },
    { id: SettingsDataTransferModule.Ledger, label: "Ledger" },
    { id: SettingsDataTransferModule.EmiLoans, label: "EMI & Loans" },
    { id: SettingsDataTransferModule.Accounts, label: "Money Accounts" },
  ] as const;

export const IMPORTABLE_SETTINGS_DATA_TRANSFER_MODULES: readonly SettingsDataTransferModuleValue[] =
  [
    SettingsDataTransferModule.Products,
    SettingsDataTransferModule.Contacts,
    SettingsDataTransferModule.Accounts,
  ] as const;

export type SettingsDataTransferTableColumn = {
  name: string;
  type: "string" | "number" | "boolean";
};

export type SettingsDataTransferTable = {
  tableName: string;
  columns: readonly SettingsDataTransferTableColumn[];
  rows: readonly Record<string, unknown>[];
};

export type SettingsDataTransferModuleData = {
  moduleId: SettingsDataTransferModuleValue;
  label: string;
  tables: readonly SettingsDataTransferTable[];
};

export type SettingsDataTransferBundle = {
  version: 1;
  exportedAt: number;
  modules: readonly SettingsDataTransferModuleData[];
};

export type ExportSettingsDataBundlePayload = {
  moduleIds: readonly SettingsDataTransferModuleValue[];
  activeAccountRemoteId: string;
  activeAccountType: AccountTypeValue;
};

export type ImportSettingsDataBundlePayload = {
  moduleId: SettingsDataTransferModuleValue;
  tables: readonly SettingsDataTransferTable[];
};

export type PickedImportFile = {
  uri: string;
  name: string;
  mimeType: string | null;
  size: number | null;
  format: ImportFileFormatValue;
};

export type ImportSettingsDataPayload = {
  activeUserRemoteId: string;
  activeAccountRemoteId: string;
  activeAccountType: AccountTypeValue;
  moduleId: SettingsDataTransferModuleValue;
  fileUri: string;
  fileName: string;
  mimeType: string | null;
  format: ImportFileFormatValue;
};

export type PreviewImportDataPayload = ImportSettingsDataPayload;

export type ConfirmImportDataPayload = {
  importJobRemoteId: string;
  activeUserRemoteId: string;
  activeAccountRemoteId: string;
};

export type ParsedImportSheet = {
  sheetName: string;
  rows: Record<string, unknown>[];
};

export type ParsedImportFile = {
  format: ImportFileFormatValue;
  fileName: string;
  sheets: ParsedImportSheet[];
};

export const ImportPreviewRowStatus = {
  Valid: "valid",
  Invalid: "invalid",
  Duplicate: "duplicate",
  Warning: "warning",
} as const;

export type ImportPreviewRowStatusValue =
  (typeof ImportPreviewRowStatus)[keyof typeof ImportPreviewRowStatus];

export const ImportJobStatus = {
  PreviewReady: "preview_ready",
  Importing: "importing",
  Completed: "completed",
  CompletedWithErrors: "completed_with_errors",
  Failed: "failed",
} as const;

export type ImportJobStatusValue =
  (typeof ImportJobStatus)[keyof typeof ImportJobStatus];

export const ImportJobRowStatus = {
  Valid: ImportPreviewRowStatus.Valid,
  Invalid: ImportPreviewRowStatus.Invalid,
  Duplicate: ImportPreviewRowStatus.Duplicate,
  Warning: ImportPreviewRowStatus.Warning,
  Imported: "imported",
  Skipped: "skipped",
  Failed: "failed",
} as const;

export type ImportJobRowStatusValue =
  (typeof ImportJobRowStatus)[keyof typeof ImportJobRowStatus];

export const ImportMode = {
  SkipInvalid: "skip_invalid",
  StrictAllOrNothing: "strict_all_or_nothing",
} as const;

export type ImportModeValue = (typeof ImportMode)[keyof typeof ImportMode];

export type ImportWarning = {
  code: string;
  message: string;
  rowNumber?: number;
};

export type ImportRowPreview = {
  rowNumber: number;
  status: ImportPreviewRowStatusValue;
  errors: string[];
  warnings: string[];
  normalizedData: Record<string, unknown>;
};

export type ImportPreviewResult = {
  importJobRemoteId: string;
  moduleId: SettingsDataTransferModuleValue;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  warnings: ImportWarning[];
  rowResults: readonly ImportRowPreview[];
};

export type ConfirmImportResult = {
  importJobRemoteId: string;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  errors: string[];
};

export type ImportJob = {
  remoteId: string;
  activeAccountRemoteId: string;
  activeUserRemoteId: string;
  moduleId: SettingsDataTransferModuleValue;
  fileName: string;
  fileFormat: ImportFileFormatValue;
  status: ImportJobStatusValue;
  importMode: ImportModeValue;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
};

export type ImportJobRow = {
  remoteId: string;
  importJobRemoteId: string;
  rowNumber: number;
  status: ImportJobRowStatusValue;
  rawData: Record<string, unknown>;
  normalizedData: Record<string, unknown> | null;
  errors: string[];
  warnings: string[];
  createdRecordRemoteId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type SettingsDataImportSummary = {
  moduleId: SettingsDataTransferModuleValue;
  importedRowCount: number;
  skippedRowCount: number;
};

export type SettingsDataExportSummary = {
  fileName: string;
  exportedModuleCount: number;
  exportedRowCount: number;
};

export type BusinessExportColumn = {
  key: string;
  label: string;
};

export type BusinessExportSheet = {
  sheetName: string;
  columns: readonly BusinessExportColumn[];
  rows: readonly Record<string, unknown>[];
};

export type BusinessExportBundle = {
  title: string;
  exportedAt: number;
  sheets: readonly BusinessExportSheet[];
};

export const DataTransferErrorType = {
  ValidationError: "VALIDATION_ERROR",
  DatasourceError: "DATASOURCE_ERROR",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type DataTransferError = {
  type: (typeof DataTransferErrorType)[keyof typeof DataTransferErrorType];
  message: string;
};

export const DataTransferValidationError = (
  message: string,
): DataTransferError => ({
  type: DataTransferErrorType.ValidationError,
  message,
});

export const DataTransferDatasourceError = (
  message = "Unable to complete the data transfer request right now.",
): DataTransferError => ({
  type: DataTransferErrorType.DatasourceError,
  message,
});

export const DataTransferUnknownError = (
  message = "An unexpected data transfer error occurred.",
): DataTransferError => ({
  type: DataTransferErrorType.UnknownError,
  message,
});

export type DataTransferResult<T> = Result<T, DataTransferError>;
