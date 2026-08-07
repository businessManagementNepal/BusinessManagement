import {
  AppearanceTextSizePreferenceValue,
  AppearanceThemePreferenceValue,
} from "@/feature/appSettings/appearance/types/appearance.types";
import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import {
  BugSeverityValue,
  DataRightItem,
  HelpFaqItem,
  SettingsDataTransferFormatValue,
  SettingsDataTransferModuleOption,
  SettingsDataTransferModuleValue,
  RegionalFinanceSettings,
  SettingsModalValue,
  SupportContactItem,
  TermsDocumentItem,
} from "@/feature/appSettings/settings/types/settings.types";
import { RegionalFinanceOption } from "@/shared/types/regionalFinance.types";

export type SettingsReportBugForm = {
  title: string;
  description: string;
  severity: BugSeverityValue;
};

export type SettingsChangePasswordForm = {
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
};

export type SettingsRowId =
  | "appearance"
  | "regionalFinance"
  | "exportData"
  | "importData"
  | "security"
  | "helpFaq"
  | "termsPrivacy"
  | "rateELekha"
  | "reportBug";

export type SettingsRow = {
  id: SettingsRowId;
  title: string;
  subtitle: string;
};

export type SettingsSection = {
  id: "preferences" | "dataTools" | "security" | "support";
  title: string;
  rows: readonly SettingsRow[];
};

export interface SettingsViewModel {
  isLoading: boolean;
  isSavingAppearance: boolean;
  isSubmittingBugReport: boolean;
  isSubmittingRating: boolean;
  isChangingPassword: boolean;
  activeModal: SettingsModalValue;
  errorMessage: string | null;
  successMessage: string | null;
  pageTitle: string;
  settingsSections: readonly SettingsSection[];
  appearanceSummaryLabel: string;
  regionalFinanceSummaryLabel: string;
  selectedThemePreference: AppearanceThemePreferenceValue;
  selectedTextSizePreference: AppearanceTextSizePreferenceValue;
  compactModeEnabled: boolean;
  exportDataFormat: SettingsDataTransferFormatValue;
  exportDataModuleSelections: readonly {
    id: SettingsDataTransferModuleValue;
    label: string;
    selected: boolean;
  }[];
  importDataModuleOptions: readonly SettingsDataTransferModuleOption[];
  isExportingData: boolean;
  isImportingData: boolean;
  isSavingRegionalFinance: boolean;
  regionalFinanceModalTitle: string;
  regionalFinanceModalSubtitle: string;
  regionalFinanceSettings: RegionalFinanceSettings;
  regionalFinanceCountryOptions: readonly RegionalFinanceOption[];
  regionalFinanceCurrencyOptions: readonly RegionalFinanceOption[];
  regionalFinanceTaxRateOptions: readonly RegionalFinanceOption[];
  regionalFinanceTaxModeOptions: readonly RegionalFinanceOption[];
  appearanceModalTitle: string;
  appearanceModalSubtitle: string;
  compactModeTitle: string;
  compactModeSubtitle: string;
  helpFaqItems: readonly HelpFaqItem[];
  supportContactItems: readonly SupportContactItem[];
  termsDocumentItems: readonly TermsDocumentItem[];
  dataRightItems: readonly DataRightItem[];
  passwordChangedLabel: string;
  deviceInfoLabel: string;
  appVersionLabel: string;
  reportBugForm: SettingsReportBugForm;
  ratingValue: number;
  ratingReview: string;
  changePasswordForm: SettingsChangePasswordForm;
  canOpenSecurity: boolean;
  isSensitiveSettingsAccessLoading: boolean;
  exportDataModalSubtitle: string;
  importDataModalSubtitle: string;
  importDataUnavailableMessage: string;
  activeAccountType: AccountTypeValue;
  onOpenSecurity: () => void;
  onOpenRegionalFinance: () => void;
  onOpenExportData: () => void;
  onOpenImportData: () => void;
  onOpenAppearance: () => void;
  onOpenHelpFaq: () => void;
  onOpenTermsPrivacy: () => void;
  onOpenRateELekha: () => void;
  onOpenReportBug: () => void;
  onOpenChangePassword: () => void;
  onCloseModal: () => void;
  onSelectThemePreference: (
    value: AppearanceThemePreferenceValue,
  ) => Promise<void>;
  onSelectTextSizePreference: (
    value: AppearanceTextSizePreferenceValue,
  ) => Promise<void>;
  onToggleCompactMode: (value: boolean) => Promise<void>;
  onChangeRegionalFinanceCountry: (value: string) => void;
  onChangeRegionalFinanceCurrency: (value: string) => void;
  onChangeRegionalFinanceTaxRate: (value: string) => void;
  onChangeRegionalFinanceTaxMode: (value: string) => void;
  onSaveRegionalFinance: () => Promise<void>;
  onChangeExportDataFormat: (value: SettingsDataTransferFormatValue) => void;
  onToggleExportDataModule: (id: SettingsDataTransferModuleValue) => void;
  onSubmitExportData: () => Promise<void>;
  onImportDataModule: (id: SettingsDataTransferModuleValue) => Promise<void>;
  onReportBugFieldChange: (
    field: keyof SettingsReportBugForm,
    value: string,
  ) => void;
  onSubmitBugReport: () => Promise<void>;
  onSelectRating: (value: number) => void;
  onRatingReviewChange: (value: string) => void;
  onSubmitRating: () => Promise<void>;
  onChangePasswordField: (
    field: keyof SettingsChangePasswordForm,
    value: string,
  ) => void;
  onSubmitPasswordChange: () => Promise<void>;
}
