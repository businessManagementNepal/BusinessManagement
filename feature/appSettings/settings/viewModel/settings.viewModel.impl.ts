import { useCallback, useEffect, useMemo, useState } from "react";
import {
  APPEARANCE_TEXT_SIZE_OPTIONS,
  APPEARANCE_THEME_OPTIONS,
  AppearancePreferences,
  AppearanceTextSizePreference,
  AppearanceTextSizePreferenceValue,
  AppearanceThemePreference,
  AppearanceThemePreferenceValue,
} from "@/feature/appSettings/appearance/types/appearance.types";
import { GetAppearancePreferencesUseCase } from "@/feature/appSettings/appearance/useCase/getAppearancePreferences.useCase";
import { SaveAppearancePreferencesUseCase } from "@/feature/appSettings/appearance/useCase/saveAppearancePreferences.useCase";
import {
  Account,
  AccountType,
  AccountTypeValue,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import { GetAccountByRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccountByRemoteId.useCase";
import { SaveAccountUseCase } from "@/feature/auth/accountSelection/useCase/saveAccount.useCase";
import {
  SETTINGS_BIOMETRIC_COMING_SOON_MESSAGE,
  SETTINGS_BIOMETRIC_LOGIN_AVAILABLE,
  SETTINGS_DEFAULT_APPEARANCE,
  SETTINGS_IMPORT_AVAILABLE,
  SETTINGS_IMPORT_DISABLED_MESSAGE,
  SETTINGS_OWNER_ADMIN_REQUIRED_MESSAGE,
  SETTINGS_PERMISSION_LOADING_MESSAGE,
  SETTINGS_TWO_FACTOR_AUTH_AVAILABLE,
  SETTINGS_TWO_FACTOR_COMING_SOON_MESSAGE,
} from "@/feature/appSettings/settings/constants/settings.constants";
import {
  IMPORTABLE_SETTINGS_DATA_TRANSFER_MODULES,
  BUG_SEVERITY_OPTIONS,
  BugSeverity,
  SETTINGS_DATA_TRANSFER_MODULE_OPTIONS,
  SETTINGS_TAX_MODE_OPTIONS,
  RegionalFinanceSettings,
  SettingsDataTransferFormat,
  SettingsDataTransferFormatValue,
  SettingsDataTransferModuleValue,
  SettingsModal,
  SettingsModalValue,
} from "@/feature/appSettings/settings/types/settings.types";
import { ImportSettingsDataUseCase } from "../useCase/importSettingsData.useCase";
import { ChangePasswordUseCase } from "../useCase/changePassword.useCase";
import { ExportSettingsDataUseCase } from "../useCase/exportSettingsData.useCase";
import { GetSettingsBootstrapUseCase } from "../useCase/getSettingsBootstrap.useCase";
import { SubmitAppRatingUseCase } from "../useCase/submitAppRating.useCase";
import { SubmitBugReportUseCase } from "../useCase/submitBugReport.useCase";
import { UpdateBiometricLoginPreferenceUseCase } from "../useCase/updateBiometricLoginPreference.useCase";
import { UpdateTwoFactorAuthPreferenceUseCase } from "../useCase/updateTwoFactorAuthPreference.useCase";
import {
  buildTaxRateLabel,
  getRegionalFinanceCountryOptions,
  resolveRegionalFinancePolicy,
} from "@/shared/utils/finance/regionalFinancePolicy";
import { RegionalFinanceOption, TaxMode } from "@/shared/types/regionalFinance.types";
import {
  SettingsChangePasswordForm,
  SettingsReportBugForm,
  SettingsSection,
  SettingsViewModel,
} from "./settings.viewModel";

const DEFAULT_REPORT_BUG_FORM: SettingsReportBugForm = {
  title: "",
  description: "",
  severity: BugSeverity.Medium,
};

const DEFAULT_CHANGE_PASSWORD_FORM: SettingsChangePasswordForm = {
  currentPassword: "",
  nextPassword: "",
  confirmPassword: "",
};

const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  ...SETTINGS_DEFAULT_APPEARANCE,
};

const DEFAULT_REGIONAL_FINANCE_SETTINGS: RegionalFinanceSettings = {
  countryCode: "NP",
  countryName: "Nepal",
  currencyCode: "NPR",
  taxMode: TaxMode.Exclusive,
  defaultTaxRatePercent: 13,
};

const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  {
    id: "preferences",
    title: "Preferences",
    rows: [
      {
        id: "appearance",
        title: "Appearance",
        subtitle: "Theme, text size, and compact mode",
      },
      {
        id: "regionalFinance",
        title: "Regional Finance",
        subtitle: "Country, currency, and tax defaults",
      },
    ],
  },
  {
    id: "dataTools",
    title: "Data Tools",
    rows: [
      {
        id: "exportData",
        title: "Export Data",
        subtitle: "Download business data as CSV, Excel, PDF, or JSON backup",
      },
      {
        id: "importData",
        title: "Import Data",
        subtitle: "Import validated CSV or Excel files with preview",
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    rows: [
      {
        id: "security",
        title: "Security Controls",
        subtitle: "Password, biometric login, active sessions",
      },
      {
        id: "termsPrivacy",
        title: "Terms & Privacy",
        subtitle: "Terms, privacy policy, and data rights",
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    rows: [
      {
        id: "helpFaq",
        title: "Help & FAQ",
        subtitle: "Guides, tutorials, and contact",
      },
      {
        id: "reportBug",
        title: "Report a Bug",
        subtitle: "Tell us what went wrong",
      },
      {
        id: "rateELekha",
        title: "Rate e-Lekha",
        subtitle: "Share your experience with the app",
      },
    ],
  },
] as const;

const themeLabelMap: Record<AppearanceThemePreferenceValue, string> =
  APPEARANCE_THEME_OPTIONS.reduce(
    (map, option) => ({
      ...map,
      [option.value]: option.label,
    }),
    {
      [AppearanceThemePreference.Light]: "Light",
      [AppearanceThemePreference.Dark]: "Dark",
      [AppearanceThemePreference.System]: "System",
    } as Record<AppearanceThemePreferenceValue, string>,
  );

const textSizeLabelMap: Record<AppearanceTextSizePreferenceValue, string> =
  APPEARANCE_TEXT_SIZE_OPTIONS.reduce(
    (map, option) => ({
      ...map,
      [option.value]: option.label,
    }),
    {
      [AppearanceTextSizePreference.Small]: "Small",
      [AppearanceTextSizePreference.Medium]: "Medium",
      [AppearanceTextSizePreference.Large]: "Large",
    } as Record<AppearanceTextSizePreferenceValue, string>,
  );

const buildRegionalFinanceSummaryLabel = (
  settings: RegionalFinanceSettings,
): string => {
  return `${settings.countryName} | ${settings.currencyCode} | ${settings.defaultTaxRatePercent}%`;
};

const buildDefaultExportModuleSelectionState = (): Record<
  SettingsDataTransferModuleValue,
  boolean
> =>
  SETTINGS_DATA_TRANSFER_MODULE_OPTIONS.reduce(
    (state, moduleOption) => ({
      ...state,
      [moduleOption.id]: true,
    }),
    {} as Record<SettingsDataTransferModuleValue, boolean>,
  );

const buildAppearanceSummaryLabel = (
  appearancePreferences: AppearancePreferences,
): string => {
  const compactModeLabel = appearancePreferences.compactModeEnabled
    ? "Compact On"
    : "Compact Off";

  return `${themeLabelMap[appearancePreferences.themePreference]} | ${
    textSizeLabelMap[appearancePreferences.textSizePreference]
  } | ${compactModeLabel}`;
};

const formatRelativeLabel = (timestamp: number | null): string => {
  if (timestamp === null) {
    return "Last changed unavailable";
  }

  const elapsedMs = Math.max(Date.now() - timestamp, 0);
  const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
  const elapsedHours = Math.floor(elapsedMs / (60 * 60 * 1000));
  const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));

  if (elapsedMinutes < 1) {
    return "Last changed just now";
  }

  if (elapsedMinutes < 60) {
    return `Last changed ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
  }

  if (elapsedHours < 24) {
    return `Last changed ${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
  }

  return `Last changed ${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
};

type Params = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountType: AccountTypeValue;
  activeAccountDisplayName: string;
  canManageSensitiveSettings: boolean;
  isSensitiveSettingsAccessLoading: boolean;
  getAppearancePreferencesUseCase: GetAppearancePreferencesUseCase;
  saveAppearancePreferencesUseCase: SaveAppearancePreferencesUseCase;
  getSettingsBootstrapUseCase: GetSettingsBootstrapUseCase;
  updateBiometricLoginPreferenceUseCase: UpdateBiometricLoginPreferenceUseCase;
  updateTwoFactorAuthPreferenceUseCase: UpdateTwoFactorAuthPreferenceUseCase;
  submitBugReportUseCase: SubmitBugReportUseCase;
  submitAppRatingUseCase: SubmitAppRatingUseCase;
  exportSettingsDataUseCase: ExportSettingsDataUseCase;
  importSettingsDataUseCase: ImportSettingsDataUseCase;
  changePasswordUseCase: ChangePasswordUseCase;
  getAccountByRemoteIdUseCase: GetAccountByRemoteIdUseCase;
  saveAccountUseCase: SaveAccountUseCase;
};

export const useSettingsViewModel = ({
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountType,
  activeAccountDisplayName,
  canManageSensitiveSettings,
  isSensitiveSettingsAccessLoading,
  getAppearancePreferencesUseCase,
  saveAppearancePreferencesUseCase,
  getSettingsBootstrapUseCase,
  updateBiometricLoginPreferenceUseCase,
  updateTwoFactorAuthPreferenceUseCase,
  submitBugReportUseCase,
  submitAppRatingUseCase,
  exportSettingsDataUseCase,
  importSettingsDataUseCase,
  changePasswordUseCase,
  getAccountByRemoteIdUseCase,
  saveAccountUseCase,
}: Params): SettingsViewModel => {
  const isBusinessAccount = activeAccountType === AccountType.Business;

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);
  const [isSavingRegionalFinance, setIsSavingRegionalFinance] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isImportingData, setIsImportingData] = useState(false);
  const [isSubmittingBugReport, setIsSubmittingBugReport] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeModal, setActiveModal] = useState<SettingsModalValue>(
    SettingsModal.None,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [helpFaqItems, setHelpFaqItems] = useState<
    SettingsViewModel["helpFaqItems"]
  >([]);
  const [supportContactItems, setSupportContactItems] = useState<
    SettingsViewModel["supportContactItems"]
  >([]);
  const [termsDocumentItems, setTermsDocumentItems] = useState<
    SettingsViewModel["termsDocumentItems"]
  >([]);
  const [dataRightItems, setDataRightItems] = useState<
    SettingsViewModel["dataRightItems"]
  >([]);
  const [securitySessions, setSecuritySessions] = useState<
    SettingsViewModel["securitySessions"]
  >([]);
  const [biometricLoginEnabled, setBiometricLoginEnabled] = useState(false);
  const [twoFactorAuthEnabled, setTwoFactorAuthEnabled] = useState(false);
  const [appearancePreferences, setAppearancePreferences] =
    useState<AppearancePreferences>(DEFAULT_APPEARANCE_PREFERENCES);
  const [exportDataFormat, setExportDataFormat] =
    useState<SettingsDataTransferFormatValue>(SettingsDataTransferFormat.Csv);
  const [exportModuleSelectionState, setExportModuleSelectionState] = useState<
    Record<SettingsDataTransferModuleValue, boolean>
  >(buildDefaultExportModuleSelectionState);
  const [regionalFinanceSettings, setRegionalFinanceSettings] =
    useState<RegionalFinanceSettings>(DEFAULT_REGIONAL_FINANCE_SETTINGS);
  const [regionalFinanceAccountSnapshot, setRegionalFinanceAccountSnapshot] =
    useState<Account | null>(null);
  const [passwordChangedAt, setPasswordChangedAt] = useState<number | null>(null);
  const [deviceInfoLabel, setDeviceInfoLabel] = useState("Unavailable");
  const [appVersionLabel, setAppVersionLabel] = useState("Unavailable");
  const [reportBugForm, setReportBugForm] = useState<SettingsReportBugForm>(
    DEFAULT_REPORT_BUG_FORM,
  );
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingReview, setRatingReview] = useState("");
  const [changePasswordForm, setChangePasswordForm] =
    useState<SettingsChangePasswordForm>(DEFAULT_CHANGE_PASSWORD_FORM);

  const sensitiveSettingsAccessMessage = useMemo(() => {
    if (!isBusinessAccount) {
      return null;
    }

    if (isSensitiveSettingsAccessLoading) {
      return SETTINGS_PERMISSION_LOADING_MESSAGE;
    }

    if (!canManageSensitiveSettings) {
      return SETTINGS_OWNER_ADMIN_REQUIRED_MESSAGE;
    }

    return null;
  }, [
    canManageSensitiveSettings,
    isBusinessAccount,
    isSensitiveSettingsAccessLoading,
  ]);

  const clearFeedback = useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  const ensureSensitiveSettingsAccess = useCallback((): boolean => {
    if (!sensitiveSettingsAccessMessage) {
      return true;
    }

    setSuccessMessage(null);
    setErrorMessage(sensitiveSettingsAccessMessage);
    return false;
  }, [sensitiveSettingsAccessMessage]);

  const loadSettings = useCallback(async () => {
    if (!activeUserRemoteId) {
      setErrorMessage("Settings require an active user session.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [bootstrapResult, appearanceResult, accountResult] = await Promise.all([
      getSettingsBootstrapUseCase.execute(activeUserRemoteId),
      getAppearancePreferencesUseCase.execute(),
      activeAccountRemoteId
        ? getAccountByRemoteIdUseCase.execute(activeAccountRemoteId)
        : Promise.resolve({
            success: true as const,
            value: null,
          }),
    ]);

    if (!bootstrapResult.success) {
      setErrorMessage(bootstrapResult.error.message);
      setIsLoading(false);
      return;
    }

    setHelpFaqItems(bootstrapResult.value.helpFaqItems);
    setSupportContactItems(bootstrapResult.value.supportContactItems);
    setTermsDocumentItems(bootstrapResult.value.termsDocumentItems);
    setDataRightItems(bootstrapResult.value.dataRightItems);
    setSecuritySessions(bootstrapResult.value.securitySessions);
    setBiometricLoginEnabled(
      bootstrapResult.value.securityPreferences.biometricLoginEnabled,
    );
    setTwoFactorAuthEnabled(
      bootstrapResult.value.securityPreferences.twoFactorAuthEnabled,
    );
    setPasswordChangedAt(bootstrapResult.value.passwordChangedAt);
    setDeviceInfoLabel(bootstrapResult.value.deviceInfo ?? "Unavailable");
    setAppVersionLabel(bootstrapResult.value.appVersion ?? "Unavailable");

    let nextErrorMessage: string | null = null;

    if (accountResult.success && accountResult.value) {
      const resolvedFinancePolicy = resolveRegionalFinancePolicy({
        countryCode: accountResult.value.countryCode,
        currencyCode: accountResult.value.currencyCode,
        defaultTaxRatePercent: accountResult.value.defaultTaxRatePercent,
        defaultTaxMode: accountResult.value.defaultTaxMode,
      });

      setRegionalFinanceAccountSnapshot(accountResult.value);
      setRegionalFinanceSettings({
        countryCode: resolvedFinancePolicy.countryCode,
        countryName: resolvedFinancePolicy.countryName,
        currencyCode: resolvedFinancePolicy.currencyCode,
        taxMode: resolvedFinancePolicy.defaultTaxMode,
        defaultTaxRatePercent: resolvedFinancePolicy.defaultTaxRatePercent,
      });
    } else {
      setRegionalFinanceAccountSnapshot(null);
      setRegionalFinanceSettings(DEFAULT_REGIONAL_FINANCE_SETTINGS);
    }

    if (!accountResult.success) {
      nextErrorMessage = accountResult.error.message;
    }

    if (!appearanceResult.success) {
      setAppearancePreferences(DEFAULT_APPEARANCE_PREFERENCES);
      setErrorMessage(appearanceResult.error.message);
      setIsLoading(false);
      return;
    }

    setAppearancePreferences(appearanceResult.value);
    setErrorMessage(nextErrorMessage);
    setIsLoading(false);
  }, [
    activeAccountRemoteId,
    activeUserRemoteId,
    getAccountByRemoteIdUseCase,
    getAppearancePreferencesUseCase,
    getSettingsBootstrapUseCase,
  ]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const regionalFinanceCountryOptions = useMemo(
    () => getRegionalFinanceCountryOptions(),
    [],
  );

  const regionalFinanceCurrencyOptions = useMemo<
    readonly RegionalFinanceOption[]
  >(() => {
    const baseCurrencyOption = {
      label: regionalFinanceSettings.currencyCode,
      value: regionalFinanceSettings.currencyCode,
    };

    const countryPolicy = resolveRegionalFinancePolicy({
      countryCode: regionalFinanceSettings.countryCode,
    });
    const countryCurrencyOption = {
      label: countryPolicy.currencyCode,
      value: countryPolicy.currencyCode,
    };

    if (baseCurrencyOption.value === countryCurrencyOption.value) {
      return [countryCurrencyOption];
    }

    return [countryCurrencyOption, baseCurrencyOption];
  }, [regionalFinanceSettings.countryCode, regionalFinanceSettings.currencyCode]);

  const regionalFinanceTaxRateOptions = useMemo<
    readonly RegionalFinanceOption[]
  >(() => {
    const countryPolicy = resolveRegionalFinancePolicy({
      countryCode: regionalFinanceSettings.countryCode,
      currencyCode: regionalFinanceSettings.currencyCode,
      defaultTaxRatePercent: regionalFinanceSettings.defaultTaxRatePercent,
      defaultTaxMode: regionalFinanceSettings.taxMode,
    });

    return countryPolicy.taxRateOptions.map((rate) => ({
      label: buildTaxRateLabel(rate),
      value: String(rate),
    }));
  }, [
    regionalFinanceSettings.countryCode,
    regionalFinanceSettings.currencyCode,
    regionalFinanceSettings.defaultTaxRatePercent,
    regionalFinanceSettings.taxMode,
  ]);

  const exportDataModuleSelections = useMemo(
    () =>
      SETTINGS_DATA_TRANSFER_MODULE_OPTIONS.map((moduleOption) => ({
        id: moduleOption.id,
        label: moduleOption.label,
        selected: exportModuleSelectionState[moduleOption.id] ?? false,
      })),
    [exportModuleSelectionState],
  );

  const importDataModuleOptions = useMemo(
    () =>
      SETTINGS_DATA_TRANSFER_MODULE_OPTIONS.map((moduleOption) => ({
        ...moduleOption,
        disabled:
          !SETTINGS_IMPORT_AVAILABLE ||
          !IMPORTABLE_SETTINGS_DATA_TRANSFER_MODULES.includes(moduleOption.id),
        statusLabel:
          !IMPORTABLE_SETTINGS_DATA_TRANSFER_MODULES.includes(moduleOption.id)
            ? "Protected."
            : !SETTINGS_IMPORT_AVAILABLE
              ? "Coming soon."
              : undefined,
        description:
          !IMPORTABLE_SETTINGS_DATA_TRANSFER_MODULES.includes(moduleOption.id)
            ? SETTINGS_IMPORT_DISABLED_MESSAGE
            : !SETTINGS_IMPORT_AVAILABLE
              ? SETTINGS_IMPORT_DISABLED_MESSAGE
              : moduleOption.description,
      })),
    [],
  );

  const onCloseModal = useCallback(() => {
    setActiveModal(SettingsModal.None);
    clearFeedback();
  }, [clearFeedback]);

  const onOpenAppearance = useCallback(() => {
    clearFeedback();
    setActiveModal(SettingsModal.Appearance);
  }, [clearFeedback]);

  const onOpenSecurity = useCallback(() => {
    clearFeedback();
    setActiveModal(SettingsModal.Security);
  }, [clearFeedback]);

  const onOpenRegionalFinance = useCallback(() => {
    if (!ensureSensitiveSettingsAccess()) {
      return;
    }

    clearFeedback();
    setActiveModal(SettingsModal.RegionalFinance);
  }, [clearFeedback, ensureSensitiveSettingsAccess]);

  const onOpenExportData = useCallback(() => {
    if (!ensureSensitiveSettingsAccess()) {
      return;
    }

    clearFeedback();
    setActiveModal(SettingsModal.ExportData);
  }, [clearFeedback, ensureSensitiveSettingsAccess]);

  const onOpenImportData = useCallback(() => {
    if (!ensureSensitiveSettingsAccess()) {
      return;
    }

    clearFeedback();
    setActiveModal(SettingsModal.ImportData);
  }, [clearFeedback, ensureSensitiveSettingsAccess]);

  const onOpenHelpFaq = useCallback(() => {
    clearFeedback();
    setActiveModal(SettingsModal.HelpFaq);
  }, [clearFeedback]);

  const onOpenTermsPrivacy = useCallback(() => {
    clearFeedback();
    setActiveModal(SettingsModal.TermsPrivacy);
  }, [clearFeedback]);

  const onOpenRateELekha = useCallback(() => {
    clearFeedback();
    setActiveModal(SettingsModal.RateELekha);
  }, [clearFeedback]);

  const onOpenReportBug = useCallback(() => {
    clearFeedback();
    setActiveModal(SettingsModal.ReportBug);
  }, [clearFeedback]);

  const onOpenChangePassword = useCallback(() => {
    clearFeedback();
    setChangePasswordForm(DEFAULT_CHANGE_PASSWORD_FORM);
    setActiveModal(SettingsModal.ChangePassword);
  }, [clearFeedback]);

  const persistAppearancePreferences = useCallback(
    async (nextPreferences: {
      themePreference: AppearanceThemePreferenceValue;
      textSizePreference: AppearanceTextSizePreferenceValue;
      compactModeEnabled: boolean;
    }) => {
      setIsSavingAppearance(true);
      setSuccessMessage(null);
      const previousPreferences = appearancePreferences;

      setAppearancePreferences((currentPreferences) => ({
        ...currentPreferences,
        ...nextPreferences,
        updatedAt: Date.now(),
      }));

      const result = await saveAppearancePreferencesUseCase.execute(
        nextPreferences,
      );

      if (!result.success) {
        setAppearancePreferences(previousPreferences);
        setErrorMessage(result.error.message);
        setIsSavingAppearance(false);
        return;
      }

      setAppearancePreferences(result.value);
      setErrorMessage(null);
      setSuccessMessage("Appearance settings updated.");
      setIsSavingAppearance(false);
    },
    [appearancePreferences, saveAppearancePreferencesUseCase],
  );

  const onSelectThemePreference = useCallback(
    async (value: AppearanceThemePreferenceValue) => {
      if (value === appearancePreferences.themePreference) {
        return;
      }

      await persistAppearancePreferences({
        themePreference: value,
        textSizePreference: appearancePreferences.textSizePreference,
        compactModeEnabled: appearancePreferences.compactModeEnabled,
      });
    },
    [appearancePreferences, persistAppearancePreferences],
  );

  const onSelectTextSizePreference = useCallback(
    async (value: AppearanceTextSizePreferenceValue) => {
      if (value === appearancePreferences.textSizePreference) {
        return;
      }

      await persistAppearancePreferences({
        themePreference: appearancePreferences.themePreference,
        textSizePreference: value,
        compactModeEnabled: appearancePreferences.compactModeEnabled,
      });
    },
    [appearancePreferences, persistAppearancePreferences],
  );

  const onToggleCompactMode = useCallback(
    async (value: boolean) => {
      if (value === appearancePreferences.compactModeEnabled) {
        return;
      }

      await persistAppearancePreferences({
        themePreference: appearancePreferences.themePreference,
        textSizePreference: appearancePreferences.textSizePreference,
        compactModeEnabled: value,
      });
    },
    [appearancePreferences, persistAppearancePreferences],
  );

  const onToggleBiometricLogin = useCallback(
    async (value: boolean) => {
      setIsSavingPreference(true);
      const result = await updateBiometricLoginPreferenceUseCase.execute(value);

      if (!result.success) {
        setErrorMessage(result.error.message);
        setIsSavingPreference(false);
        return;
      }

      setBiometricLoginEnabled(value);
      setErrorMessage(null);
      setSuccessMessage(
        value
          ? "Biometric login preference updated."
          : "Biometric login preference disabled.",
      );
      setIsSavingPreference(false);
    },
    [updateBiometricLoginPreferenceUseCase],
  );

  const onToggleTwoFactorAuth = useCallback(
    async (value: boolean) => {
      setIsSavingPreference(true);
      const result = await updateTwoFactorAuthPreferenceUseCase.execute(value);

      if (!result.success) {
        setErrorMessage(result.error.message);
        setIsSavingPreference(false);
        return;
      }

      setTwoFactorAuthEnabled(value);
      setErrorMessage(null);
      setSuccessMessage(
        value
          ? "Two-factor auth preference updated."
          : "Two-factor auth preference disabled.",
      );
      setIsSavingPreference(false);
    },
    [updateTwoFactorAuthPreferenceUseCase],
  );

  const onChangeRegionalFinanceCountry = useCallback(
    (value: string) => {
      const countryPolicy = resolveRegionalFinancePolicy({
        countryCode: value,
        currencyCode: regionalFinanceSettings.currencyCode,
        defaultTaxRatePercent: regionalFinanceSettings.defaultTaxRatePercent,
        defaultTaxMode: regionalFinanceSettings.taxMode,
      });

      setRegionalFinanceSettings((current) => ({
        ...current,
        countryCode: countryPolicy.countryCode,
        countryName: countryPolicy.countryName,
        currencyCode: countryPolicy.currencyCode,
        defaultTaxRatePercent: countryPolicy.defaultTaxRatePercent,
      }));
      clearFeedback();
    },
    [
      clearFeedback,
      regionalFinanceSettings.currencyCode,
      regionalFinanceSettings.defaultTaxRatePercent,
      regionalFinanceSettings.taxMode,
    ],
  );

  const onChangeRegionalFinanceCurrency = useCallback(
    (value: string) => {
      const normalizedCurrencyCode = value.trim().toUpperCase();
      if (!normalizedCurrencyCode) {
        return;
      }

      setRegionalFinanceSettings((current) => ({
        ...current,
        currencyCode: normalizedCurrencyCode,
      }));
      clearFeedback();
    },
    [clearFeedback],
  );

  const onChangeRegionalFinanceTaxRate = useCallback(
    (value: string) => {
      const parsedValue = Number(value.trim());
      if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        return;
      }

      setRegionalFinanceSettings((current) => ({
        ...current,
        defaultTaxRatePercent: parsedValue,
      }));
      clearFeedback();
    },
    [clearFeedback],
  );

  const onChangeRegionalFinanceTaxMode = useCallback(
    (value: string) => {
      if (value !== TaxMode.Exclusive && value !== TaxMode.Inclusive) {
        return;
      }

      setRegionalFinanceSettings((current) => ({
        ...current,
        taxMode: value,
      }));
      clearFeedback();
    },
    [clearFeedback],
  );

  const onSaveRegionalFinance = useCallback(async (): Promise<void> => {
    if (!ensureSensitiveSettingsAccess()) {
      return;
    }

    if (!regionalFinanceAccountSnapshot) {
      setErrorMessage("Regional finance settings require an active account.");
      return;
    }

    setIsSavingRegionalFinance(true);

    const saveResult = await saveAccountUseCase.execute({
      remoteId: regionalFinanceAccountSnapshot.remoteId,
      ownerUserRemoteId: regionalFinanceAccountSnapshot.ownerUserRemoteId,
      accountType: regionalFinanceAccountSnapshot.accountType,
      businessType: regionalFinanceAccountSnapshot.businessType,
      displayName: regionalFinanceAccountSnapshot.displayName,
      currencyCode: regionalFinanceSettings.currencyCode,
      cityOrLocation: regionalFinanceAccountSnapshot.cityOrLocation,
      countryCode: regionalFinanceSettings.countryCode,
      defaultTaxRatePercent: regionalFinanceSettings.defaultTaxRatePercent,
      defaultTaxMode: regionalFinanceSettings.taxMode,
      isActive: regionalFinanceAccountSnapshot.isActive,
      isDefault: regionalFinanceAccountSnapshot.isDefault,
    });

    if (!saveResult.success) {
      setErrorMessage(saveResult.error.message);
      setIsSavingRegionalFinance(false);
      return;
    }

    const resolvedFinancePolicy = resolveRegionalFinancePolicy({
      countryCode: saveResult.value.countryCode,
      currencyCode: saveResult.value.currencyCode,
      defaultTaxRatePercent: saveResult.value.defaultTaxRatePercent,
      defaultTaxMode: saveResult.value.defaultTaxMode,
    });

    setRegionalFinanceAccountSnapshot(saveResult.value);
    setRegionalFinanceSettings({
      countryCode: resolvedFinancePolicy.countryCode,
      countryName: resolvedFinancePolicy.countryName,
      currencyCode: resolvedFinancePolicy.currencyCode,
      taxMode: resolvedFinancePolicy.defaultTaxMode,
      defaultTaxRatePercent: resolvedFinancePolicy.defaultTaxRatePercent,
    });
    setErrorMessage(null);
    setSuccessMessage("Regional finance settings updated.");
    setIsSavingRegionalFinance(false);
    setActiveModal(SettingsModal.None);
  }, [
    ensureSensitiveSettingsAccess,
    regionalFinanceAccountSnapshot,
    regionalFinanceSettings.countryCode,
    regionalFinanceSettings.currencyCode,
    regionalFinanceSettings.defaultTaxRatePercent,
    regionalFinanceSettings.taxMode,
    saveAccountUseCase,
  ]);

  const onChangeExportDataFormat = useCallback(
    (value: SettingsDataTransferFormatValue) => {
      setExportDataFormat(value);
      clearFeedback();
    },
    [clearFeedback],
  );

  const onToggleExportDataModule = useCallback(
    (id: SettingsDataTransferModuleValue) => {
      setExportModuleSelectionState((currentSelectionState) => ({
        ...currentSelectionState,
        [id]: !currentSelectionState[id],
      }));
      clearFeedback();
    },
    [clearFeedback],
  );

  const onSubmitExportData = useCallback(async () => {
    if (!ensureSensitiveSettingsAccess()) {
      return;
    }

    const selectedModuleIds = exportDataModuleSelections
      .filter((selection) => selection.selected)
      .map((selection) => selection.id);

    if (selectedModuleIds.length === 0) {
      setErrorMessage("Select at least one data group to export.");
      return;
    }

    if (!activeUserRemoteId || !activeAccountRemoteId) {
      setErrorMessage("An active account is required to export data.");
      return;
    }

    setIsExportingData(true);

    const result = await exportSettingsDataUseCase.execute({
      format: exportDataFormat,
      moduleIds: selectedModuleIds,
      activeUserRemoteId,
      activeAccountRemoteId,
      activeAccountType,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      setIsExportingData(false);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(
      `Exported ${result.value.exportedRowCount} records to ${result.value.fileName}.`,
    );
    setIsExportingData(false);
    setActiveModal(SettingsModal.None);
  }, [
    activeAccountRemoteId,
    activeAccountType,
    activeUserRemoteId,
    ensureSensitiveSettingsAccess,
    exportDataFormat,
    exportDataModuleSelections,
    exportSettingsDataUseCase,
  ]);

  const onImportDataModule = useCallback(
    async (moduleId: SettingsDataTransferModuleValue) => {
      if (!ensureSensitiveSettingsAccess()) {
        return;
      }

      setIsImportingData(true);

      const result = await importSettingsDataUseCase.execute({ moduleId });
      if (!result.success) {
        setErrorMessage(result.error.message);
        setIsImportingData(false);
        return;
      }

      setErrorMessage(null);
      setSuccessMessage(
        `Imported ${result.value.importedRowCount} records${result.value.skippedRowCount > 0 ? ` (${result.value.skippedRowCount} skipped)` : ""}.`,
      );
      setIsImportingData(false);
      setActiveModal(SettingsModal.None);
    },
    [ensureSensitiveSettingsAccess, importSettingsDataUseCase],
  );

  const onReportBugFieldChange = useCallback(
    (field: keyof SettingsReportBugForm, value: string) => {
      setReportBugForm((current) => {
        if (field === "severity") {
          const matchedValue =
            BUG_SEVERITY_OPTIONS.find((option) => option.value === value)
              ?.value ?? current.severity;

          return {
            ...current,
            severity: matchedValue,
          };
        }

        return {
          ...current,
          [field]: value,
        };
      });
      setErrorMessage(null);
    },
    [],
  );

  const onSubmitBugReport = useCallback(async () => {
    if (!activeUserRemoteId) {
      setErrorMessage("An active user is required to report a bug.");
      return;
    }

    setIsSubmittingBugReport(true);
    const result = await submitBugReportUseCase.execute({
      userRemoteId: activeUserRemoteId,
      title: reportBugForm.title,
      description: reportBugForm.description,
      severity: reportBugForm.severity,
      deviceInfo: deviceInfoLabel === "Unavailable" ? null : deviceInfoLabel,
      appVersion: appVersionLabel === "Unavailable" ? null : appVersionLabel,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      setIsSubmittingBugReport(false);
      return;
    }

    setReportBugForm(DEFAULT_REPORT_BUG_FORM);
    setErrorMessage(null);
    setSuccessMessage("Bug report submitted successfully.");
    setIsSubmittingBugReport(false);
    setActiveModal(SettingsModal.None);
  }, [
    activeUserRemoteId,
    appVersionLabel,
    deviceInfoLabel,
    reportBugForm.description,
    reportBugForm.severity,
    reportBugForm.title,
    submitBugReportUseCase,
  ]);

  const onSelectRating = useCallback((value: number) => {
    setRatingValue(value);
    setErrorMessage(null);
  }, []);

  const onRatingReviewChange = useCallback((value: string) => {
    setRatingReview(value);
    setErrorMessage(null);
  }, []);

  const onSubmitRating = useCallback(async () => {
    if (!activeUserRemoteId) {
      setErrorMessage("An active user is required to rate e-Lekha.");
      return;
    }

    setIsSubmittingRating(true);
    const result = await submitAppRatingUseCase.execute({
      userRemoteId: activeUserRemoteId,
      starCount: ratingValue,
      review: ratingReview,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      setIsSubmittingRating(false);
      return;
    }

    setRatingValue(0);
    setRatingReview("");
    setErrorMessage(null);
    setSuccessMessage("Thanks for rating e-Lekha.");
    setIsSubmittingRating(false);
    setActiveModal(SettingsModal.None);
  }, [activeUserRemoteId, ratingReview, ratingValue, submitAppRatingUseCase]);

  const onChangePasswordField = useCallback(
    (field: keyof SettingsChangePasswordForm, value: string) => {
      setChangePasswordForm((current) => ({
        ...current,
        [field]: value,
      }));
      setErrorMessage(null);
    },
    [],
  );

  const onSubmitPasswordChange = useCallback(async () => {
    if (!activeUserRemoteId) {
      setErrorMessage("An active user is required to change password.");
      return;
    }

    setIsChangingPassword(true);
    const result = await changePasswordUseCase.execute({
      userRemoteId: activeUserRemoteId,
      currentPassword: changePasswordForm.currentPassword,
      nextPassword: changePasswordForm.nextPassword,
      confirmPassword: changePasswordForm.confirmPassword,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      setIsChangingPassword(false);
      return;
    }

    setChangePasswordForm(DEFAULT_CHANGE_PASSWORD_FORM);
    setPasswordChangedAt(Date.now());
    setErrorMessage(null);
    setSuccessMessage("Password changed successfully.");
    setIsChangingPassword(false);
    setActiveModal(SettingsModal.Security);
  }, [activeUserRemoteId, changePasswordForm, changePasswordUseCase]);

  return useMemo(
    () => ({
      isLoading,
      isSavingPreference,
      isSavingAppearance,
      isSubmittingBugReport,
      isSubmittingRating,
      isChangingPassword,
      activeModal,
      errorMessage,
      successMessage,
      pageTitle: "Settings",
      settingsSections: SETTINGS_SECTIONS,
      appearanceSummaryLabel: buildAppearanceSummaryLabel(appearancePreferences),
      regionalFinanceSummaryLabel: buildRegionalFinanceSummaryLabel(
        regionalFinanceSettings,
      ),
      selectedThemePreference: appearancePreferences.themePreference,
      selectedTextSizePreference: appearancePreferences.textSizePreference,
      compactModeEnabled: appearancePreferences.compactModeEnabled,
      exportDataFormat,
      exportDataModuleSelections,
      importDataModuleOptions,
      isExportingData,
      isImportingData,
      isSavingRegionalFinance,
      regionalFinanceModalTitle: "Regional Finance",
      regionalFinanceModalSubtitle:
        "Country, currency, and tax defaults are saved for the active account only.",
      regionalFinanceSettings,
      regionalFinanceCountryOptions,
      regionalFinanceCurrencyOptions,
      regionalFinanceTaxRateOptions,
      regionalFinanceTaxModeOptions: SETTINGS_TAX_MODE_OPTIONS,
      appearanceModalTitle: "Appearance",
      appearanceModalSubtitle: "Changes are saved automatically.",
      compactModeTitle: "Compact Mode",
      compactModeSubtitle: "Reduce spacing for more content",
      helpFaqItems,
      supportContactItems,
      termsDocumentItems,
      dataRightItems,
      securitySessions,
      biometricLoginEnabled,
      biometricLoginSubtitle: SETTINGS_BIOMETRIC_LOGIN_AVAILABLE
        ? "Fingerprint or Face ID"
        : SETTINGS_BIOMETRIC_COMING_SOON_MESSAGE,
      biometricLoginToggleDisabled:
        !SETTINGS_BIOMETRIC_LOGIN_AVAILABLE || isSavingPreference,
      twoFactorAuthEnabled,
      twoFactorAuthSubtitle: SETTINGS_TWO_FACTOR_AUTH_AVAILABLE
        ? "Extra layer of security"
        : SETTINGS_TWO_FACTOR_COMING_SOON_MESSAGE,
      twoFactorAuthToggleDisabled:
        !SETTINGS_TWO_FACTOR_AUTH_AVAILABLE || isSavingPreference,
      passwordChangedLabel: formatRelativeLabel(passwordChangedAt),
      deviceInfoLabel,
      appVersionLabel,
      reportBugForm,
      ratingValue,
      ratingReview,
      changePasswordForm,
      canOpenSecurity: Boolean(activeUserRemoteId),
      isSensitiveSettingsAccessLoading,
      exportDataModalSubtitle: activeAccountDisplayName.trim()
        ? `Only data from ${activeAccountDisplayName.trim()} will be exported. Other accounts are excluded.`
        : "Only data from the active account will be exported. Other accounts are excluded.",
      importDataModalSubtitle:
        "Preview always runs before confirm, and imported rows only write through existing domain workflows.",
      importDataUnavailableMessage:
        "Only Products, Contacts, and Money Accounts are available for safe import in v1.",
      activeAccountType,
      onOpenAppearance,
      onOpenRegionalFinance,
      onOpenExportData,
      onOpenImportData,
      onOpenSecurity,
      onOpenHelpFaq,
      onOpenTermsPrivacy,
      onOpenRateELekha,
      onOpenReportBug,
      onOpenChangePassword,
      onCloseModal,
      onToggleBiometricLogin,
      onToggleTwoFactorAuth,
      onSelectThemePreference,
      onSelectTextSizePreference,
      onToggleCompactMode,
      onChangeRegionalFinanceCountry,
      onChangeRegionalFinanceCurrency,
      onChangeRegionalFinanceTaxRate,
      onChangeRegionalFinanceTaxMode,
      onSaveRegionalFinance,
      onChangeExportDataFormat,
      onToggleExportDataModule,
      onSubmitExportData,
      onImportDataModule,
      onReportBugFieldChange,
      onSubmitBugReport,
      onSelectRating,
      onRatingReviewChange,
      onSubmitRating,
      onChangePasswordField,
      onSubmitPasswordChange,
    }),
    [
      activeAccountDisplayName,
      activeAccountType,
      activeModal,
      activeUserRemoteId,
      appearancePreferences,
      appVersionLabel,
      biometricLoginEnabled,
      changePasswordForm,
      dataRightItems,
      deviceInfoLabel,
      errorMessage,
      exportDataFormat,
      exportDataModuleSelections,
      helpFaqItems,
      importDataModuleOptions,
      isChangingPassword,
      isExportingData,
      isImportingData,
      isLoading,
      isSavingAppearance,
      isSavingPreference,
      isSavingRegionalFinance,
      isSensitiveSettingsAccessLoading,
      isSubmittingBugReport,
      isSubmittingRating,
      onChangeExportDataFormat,
      onChangePasswordField,
      onChangeRegionalFinanceCountry,
      onChangeRegionalFinanceCurrency,
      onChangeRegionalFinanceTaxMode,
      onChangeRegionalFinanceTaxRate,
      onCloseModal,
      onImportDataModule,
      onOpenAppearance,
      onOpenChangePassword,
      onOpenExportData,
      onOpenHelpFaq,
      onOpenImportData,
      onOpenRateELekha,
      onOpenRegionalFinance,
      onOpenReportBug,
      onOpenSecurity,
      onOpenTermsPrivacy,
      onRatingReviewChange,
      onReportBugFieldChange,
      onSaveRegionalFinance,
      onSelectRating,
      onSelectTextSizePreference,
      onSelectThemePreference,
      onSubmitBugReport,
      onSubmitExportData,
      onSubmitPasswordChange,
      onSubmitRating,
      onToggleBiometricLogin,
      onToggleCompactMode,
      onToggleExportDataModule,
      onToggleTwoFactorAuth,
      passwordChangedAt,
      ratingReview,
      ratingValue,
      regionalFinanceCountryOptions,
      regionalFinanceCurrencyOptions,
      regionalFinanceSettings,
      regionalFinanceTaxRateOptions,
      reportBugForm,
      securitySessions,
      successMessage,
      supportContactItems,
      termsDocumentItems,
      twoFactorAuthEnabled,
    ],
  );
};
