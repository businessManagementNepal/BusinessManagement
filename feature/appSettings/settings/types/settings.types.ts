import { Result } from "@/shared/types/result.types";
import { TaxMode, TaxModeValue } from "@/shared/types/regionalFinance.types";
import {
  IMPORTABLE_SETTINGS_DATA_TRANSFER_MODULES,
  SETTINGS_DATA_TRANSFER_MODULE_OPTIONS,
  SettingsDataTransferFormat,
  SettingsDataTransferModule,
  type ExportSettingsDataBundlePayload,
  type ImportSettingsDataBundlePayload,
  type SettingsDataExportSummary,
  type SettingsDataImportSummary,
  type SettingsDataTransferBundle,
  type SettingsDataTransferFormatValue,
  type SettingsDataTransferModuleOption,
  type SettingsDataTransferModuleValue,
  type SettingsDataTransferTable,
  type SettingsDataTransferTableColumn,
  type SettingsDataTransferModuleData,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

export {
  IMPORTABLE_SETTINGS_DATA_TRANSFER_MODULES,
  SETTINGS_DATA_TRANSFER_MODULE_OPTIONS,
  SettingsDataTransferFormat,
  SettingsDataTransferModule,
};
export type {
  ExportSettingsDataBundlePayload,
  ImportSettingsDataBundlePayload,
  SettingsDataExportSummary,
  SettingsDataImportSummary,
  SettingsDataTransferBundle,
  SettingsDataTransferFormatValue,
  SettingsDataTransferModuleData,
  SettingsDataTransferModuleOption,
  SettingsDataTransferModuleValue,
  SettingsDataTransferTable,
  SettingsDataTransferTableColumn,
};

export const SettingsModal = {
  None: "none",
  Appearance: "appearance",
  Security: "security",
  RegionalFinance: "regional_finance",
  ExportData: "export_data",
  ImportData: "import_data",
  ChangePassword: "change_password",
  HelpFaq: "help_faq",
  TermsPrivacy: "terms_privacy",
  RateELekha: "rate_e_lekha",
  ReportBug: "report_bug",
} as const;

export type SettingsModalValue =
  (typeof SettingsModal)[keyof typeof SettingsModal];

export const BugSeverity = {
  Low: "low",
  Medium: "medium",
  High: "high",
} as const;

export type BugSeverityValue = (typeof BugSeverity)[keyof typeof BugSeverity];

export const BUG_SEVERITY_OPTIONS = [
  { label: "Low", value: BugSeverity.Low },
  { label: "Medium", value: BugSeverity.Medium },
  { label: "High", value: BugSeverity.High },
] as const;

export type HelpFaqItem = {
  id: string;
  question: string;
  answer: string;
  href?: string;
  actionLabel?: string;
};

export type SupportContactItem = {
  id: string;
  title: string;
  value: string;
  href?: string;
  actionLabel?: string;
};

export type TermsDocumentItem = {
  id: string;
  title: string;
  subtitle: string;
  href?: string;
  actionLabel?: string;
};

export type DataRightItem = {
  id: string;
  label: string;
  description?: string;
  href?: string;
  actionLabel?: string;
};

export type SecurityPreferences = {
  biometricLoginEnabled: boolean;
  twoFactorAuthEnabled: boolean;
};

export type SecuritySessionItem = {
  id: string;
  title: string;
  subtitle: string;
  activityLabel: string;
  isActive: boolean;
};

export type RegionalFinanceSettings = {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  taxMode: TaxModeValue;
  defaultTaxRatePercent: number;
};

export const SETTINGS_TAX_MODE_OPTIONS = [
  { label: "Tax Exclusive", value: TaxMode.Exclusive },
  { label: "Tax Inclusive", value: TaxMode.Inclusive },
] as const;

export type SettingsBootstrap = {
  securityPreferences: SecurityPreferences;
  helpFaqItems: readonly HelpFaqItem[];
  supportContactItems: readonly SupportContactItem[];
  termsDocumentItems: readonly TermsDocumentItem[];
  dataRightItems: readonly DataRightItem[];
  deviceInfo: string | null;
  appVersion: string | null;
  securitySessions: readonly SecuritySessionItem[];
  passwordChangedAt: number | null;
  lastPasswordLoginAt: number | null;
};

export type SubmitBugReportPayload = {
  userRemoteId: string;
  title: string;
  description: string;
  severity: BugSeverityValue;
  deviceInfo: string | null;
  appVersion: string | null;
};

export type BugReport = {
  remoteId: string;
  userRemoteId: string;
  title: string;
  description: string;
  severity: BugSeverityValue;
  deviceInfo: string | null;
  appVersion: string | null;
  submittedAt: number;
  createdAt: number;
  updatedAt: number;
};

export type SubmitAppRatingPayload = {
  userRemoteId: string;
  starCount: number;
  review: string;
};

export type AppRating = {
  remoteId: string;
  userRemoteId: string;
  starCount: number;
  review: string | null;
  submittedAt: number;
  createdAt: number;
  updatedAt: number;
};

export type ChangePasswordPayload = {
  userRemoteId: string;
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
};

export const SettingsErrorType = {
  ValidationError: "VALIDATION_ERROR",
  DataSourceError: "DATASOURCE_ERROR",
  AuthError: "AUTH_ERROR",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type SettingsError = {
  type: (typeof SettingsErrorType)[keyof typeof SettingsErrorType];
  message: string;
};

export const SettingsValidationError = (message: string): SettingsError => ({
  type: SettingsErrorType.ValidationError,
  message,
});

export const SettingsDatasourceError: SettingsError = {
  type: SettingsErrorType.DataSourceError,
  message: "Unable to load settings right now. Please try again.",
};

export const SettingsAuthError = (message: string): SettingsError => ({
  type: SettingsErrorType.AuthError,
  message,
});

export const SettingsUnknownError: SettingsError = {
  type: SettingsErrorType.UnknownError,
  message: "An unexpected settings error occurred.",
};

export type SettingsBootstrapResult = Result<SettingsBootstrap, SettingsError>;
export type SettingsOperationResult = Result<boolean, SettingsError>;
export type SubmitBugReportResult = Result<BugReport, SettingsError>;
export type SubmitAppRatingResult = Result<AppRating, SettingsError>;
export type ExportSettingsDataBundleResult = Result<
  SettingsDataTransferBundle,
  SettingsError
>;
export type ImportSettingsDataBundleResult = Result<
  SettingsDataImportSummary,
  SettingsError
>;
export type ExportSettingsDataResult = Result<
  SettingsDataExportSummary,
  SettingsError
>;
export type ImportSettingsDataResult = Result<
  SettingsDataImportSummary,
  SettingsError
>;
