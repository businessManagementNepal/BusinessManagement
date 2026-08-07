// @vitest-environment jsdom

import {
  AppearanceTextSizePreference,
  AppearanceThemePreference,
} from "@/feature/appSettings/appearance/types/appearance.types";
import { useSettingsViewModel } from "@/feature/appSettings/settings/viewModel/settings.viewModel.impl";
import { SettingsModal } from "@/feature/appSettings/settings/types/settings.types";
import {
  AccountType,
  AccountTypeValue,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import { BUSINESS_TYPE_VALUES } from "@/shared/constants/businessType.constants";
import { TaxMode } from "@/shared/types/regionalFinance.types";
import React, { act, useEffect } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const buildAccount = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "account-1",
  ownerUserRemoteId: "owner-1",
  accountType: AccountType.Business,
  businessType: BUSINESS_TYPE_VALUES[0],
  displayName: "Acme Traders",
  currencyCode: "NPR",
  cityOrLocation: "Kathmandu",
  countryCode: "NP",
  defaultTaxRatePercent: 13,
  defaultTaxMode: TaxMode.Exclusive,
  isActive: true,
  isDefault: true,
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildBootstrapResult = () => ({
  success: true as const,
  value: {
    securityPreferences: {
      biometricLoginEnabled: false,
      twoFactorAuthEnabled: false,
    },
    helpFaqItems: [
      {
        id: "faq-1",
        question: "How do I create an invoice?",
        answer: "Open Billing and save a billing document before sharing it.",
      },
    ],
    supportContactItems: [
      {
        id: "support",
        title: "Support Email",
        value: "support@e-lekha.com",
        href: "mailto:support@e-lekha.com",
        actionLabel: "Email support",
      },
    ],
    termsDocumentItems: [
      {
        id: "privacy-policy",
        title: "Privacy Policy",
        subtitle: "Request the latest privacy policy by email.",
        href: "mailto:support@e-lekha.com?subject=Privacy%20Policy",
        actionLabel: "Request copy",
      },
    ],
    dataRightItems: [
      {
        id: "access",
        label: "Request access to your data",
        description: "Ask support for a copy of your active account data.",
        href: "mailto:support@e-lekha.com?subject=Data%20Access",
        actionLabel: "Email support",
      },
    ],
    deviceInfo: "Platform: web",
    appVersion: "1.0.0",
    securitySessions: [
      {
        id: "current-device",
        title: "This device",
        subtitle: "Current web session",
        activityLabel: "Active now",
        isActive: true,
      },
    ],
    passwordChangedAt: 1_710_000_000_000,
    lastPasswordLoginAt: 1_710_000_000_000,
  },
});

const buildAppearanceResult = (overrides: Record<string, unknown> = {}) => ({
  success: true as const,
  value: {
    themePreference: AppearanceThemePreference.Light,
    textSizePreference: AppearanceTextSizePreference.Medium,
    compactModeEnabled: false,
    updatedAt: 1_710_000_000_000,
    ...overrides,
  },
});

type HarnessProps = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountType: AccountTypeValue;
  activeAccountDisplayName: string;
  canManageSensitiveSettings: boolean;
  isSensitiveSettingsAccessLoading: boolean;
  getAppearancePreferencesUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  saveAppearancePreferencesUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  getSettingsBootstrapUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  submitBugReportUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  submitAppRatingUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  exportSettingsDataUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  importSettingsDataUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  changePasswordUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  getAccountByRemoteIdUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  saveAccountUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  onUpdate: (value: ReturnType<typeof useSettingsViewModel>) => void;
};

function SettingsViewModelHarness(props: HarnessProps) {
  const viewModel = useSettingsViewModel({
    activeUserRemoteId: props.activeUserRemoteId,
    activeAccountRemoteId: props.activeAccountRemoteId,
    activeAccountType: props.activeAccountType,
    activeAccountDisplayName: props.activeAccountDisplayName,
    canManageSensitiveSettings: props.canManageSensitiveSettings,
    isSensitiveSettingsAccessLoading: props.isSensitiveSettingsAccessLoading,
    getAppearancePreferencesUseCase:
      props.getAppearancePreferencesUseCase as never,
    saveAppearancePreferencesUseCase:
      props.saveAppearancePreferencesUseCase as never,
    getSettingsBootstrapUseCase: props.getSettingsBootstrapUseCase as never,
    submitBugReportUseCase: props.submitBugReportUseCase as never,
    submitAppRatingUseCase: props.submitAppRatingUseCase as never,
    exportSettingsDataUseCase: props.exportSettingsDataUseCase as never,
    importSettingsDataUseCase: props.importSettingsDataUseCase as never,
    changePasswordUseCase: props.changePasswordUseCase as never,
    getAccountByRemoteIdUseCase: props.getAccountByRemoteIdUseCase as never,
    saveAccountUseCase: props.saveAccountUseCase as never,
  });

  useEffect(() => {
    props.onUpdate(viewModel);
  }, [props, viewModel]);

  return null;
}

const flushEffects = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("settings.viewModel", () => {
  let container: HTMLDivElement;
  let root: Root;
  let latestViewModel: ReturnType<typeof useSettingsViewModel> | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    latestViewModel = null;
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  const renderHarness = async (overrides: Partial<HarnessProps> = {}) => {
    const props: HarnessProps = {
      activeUserRemoteId: "owner-1",
      activeAccountRemoteId: "account-1",
      activeAccountType: AccountType.Business,
      activeAccountDisplayName: "Acme Traders",
      canManageSensitiveSettings: true,
      isSensitiveSettingsAccessLoading: false,
      getAppearancePreferencesUseCase: {
        execute: vi.fn(async () => buildAppearanceResult()),
      },
      saveAppearancePreferencesUseCase: {
        execute: vi.fn(async (payload) => ({
          success: true as const,
          value: {
            ...payload,
            updatedAt: 1_710_000_000_123,
          },
        })),
      },
      getSettingsBootstrapUseCase: {
        execute: vi.fn(async () => buildBootstrapResult()),
      },
      submitBugReportUseCase: {
        execute: vi.fn(async () => ({ success: true as const, value: true })),
      },
      submitAppRatingUseCase: {
        execute: vi.fn(async () => ({ success: true as const, value: true })),
      },
      exportSettingsDataUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            fileName: "export.json",
            exportedModuleCount: 1,
            exportedRowCount: 3,
          },
        })),
      },
      importSettingsDataUseCase: {
        execute: vi.fn(async () => ({
          success: false as const,
          error: {
            type: "VALIDATION_ERROR" as const,
            message: "Data import is disabled in v1.",
          },
        })),
      },
      changePasswordUseCase: {
        execute: vi.fn(async () => ({ success: true as const, value: true })),
      },
      getAccountByRemoteIdUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: buildAccount(),
        })),
      },
      saveAccountUseCase: {
        execute: vi.fn(async (payload) => ({
          success: true as const,
          value: buildAccount({
            ...payload,
            updatedAt: 1_710_000_000_456,
          }),
        })),
      },
      onUpdate: (value) => {
        latestViewModel = value;
      },
      ...overrides,
    };

    await act(async () => {
      root.render(<SettingsViewModelHarness {...props} />);
      await flushEffects();
    });

    return props;
  };

  it("loads bootstrap state, appearance, and account finance settings", async () => {
    const props = await renderHarness();

    expect(latestViewModel?.isLoading).toBe(false);
    expect(latestViewModel?.pageTitle).toBe("Settings");
    expect(latestViewModel?.helpFaqItems[0]?.answer).toContain("Billing");
    expect(latestViewModel?.appearanceSummaryLabel).toBe(
      "Light | Medium | Compact Off",
    );
    expect(latestViewModel?.regionalFinanceSummaryLabel).toContain("NPR");
    expect(
      latestViewModel?.settingsSections
        .find((section) => section.id === "security")
        ?.rows.find((row) => row.id === "security")?.subtitle,
    ).toBe("Change your local password");
    expect(
      latestViewModel?.settingsSections
        .find((section) => section.id === "dataTools")
        ?.rows.find((row) => row.id === "exportData")?.subtitle,
    ).toBe("Export business data as CSV, Excel, PDF, or JSON file");
    expect(props.getAccountByRemoteIdUseCase?.execute).toHaveBeenCalledWith(
      "account-1",
    );
  });

  it("persists appearance preferences through the save use case", async () => {
    const saveAppearanceExecute = vi.fn(async (payload) => ({
      success: true as const,
      value: {
        ...payload,
        updatedAt: 1_710_000_000_789,
      },
    }));

    await renderHarness({
      saveAppearancePreferencesUseCase: {
        execute: saveAppearanceExecute,
      },
    });

    await act(async () => {
      await latestViewModel?.onSelectThemePreference(
        AppearanceThemePreference.Dark,
      );
      await flushEffects();
    });

    expect(saveAppearanceExecute).toHaveBeenCalledWith({
      themePreference: AppearanceThemePreference.Dark,
      textSizePreference: AppearanceTextSizePreference.Medium,
      compactModeEnabled: false,
    });
    expect(latestViewModel?.selectedThemePreference).toBe(
      AppearanceThemePreference.Dark,
    );

    await act(async () => {
      await latestViewModel?.onSelectTextSizePreference(
        AppearanceTextSizePreference.Large,
      );
      await flushEffects();
    });

    expect(latestViewModel?.selectedTextSizePreference).toBe(
      AppearanceTextSizePreference.Large,
    );

    await act(async () => {
      await latestViewModel?.onToggleCompactMode(true);
      await flushEffects();
    });

    expect(latestViewModel?.compactModeEnabled).toBe(true);
    expect(latestViewModel?.successMessage).toBe("Appearance settings updated.");
  });

  it("saves regional finance settings at the account level", async () => {
    const saveAccountExecute = vi.fn(async (payload) => ({
      success: true as const,
      value: buildAccount({
        ...payload,
        countryCode: "IN",
        currencyCode: "INR",
        defaultTaxRatePercent: 18,
        defaultTaxMode: TaxMode.Inclusive,
      }),
    }));

    await renderHarness({
      saveAccountUseCase: {
        execute: saveAccountExecute,
      },
    });

    await act(async () => {
      latestViewModel?.onOpenRegionalFinance();
      latestViewModel?.onChangeRegionalFinanceCountry("IN");
      latestViewModel?.onChangeRegionalFinanceCurrency("INR");
      latestViewModel?.onChangeRegionalFinanceTaxRate("18");
      latestViewModel?.onChangeRegionalFinanceTaxMode(TaxMode.Inclusive);
      await flushEffects();
    });

    await act(async () => {
      await latestViewModel?.onSaveRegionalFinance();
      await flushEffects();
    });

    expect(saveAccountExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: "account-1",
        countryCode: "IN",
        currencyCode: "INR",
        defaultTaxRatePercent: 18,
        defaultTaxMode: TaxMode.Inclusive,
      }),
    );
    expect(latestViewModel?.regionalFinanceSettings.countryCode).toBe("IN");
    expect(latestViewModel?.regionalFinanceSettings.currencyCode).toBe("INR");
    expect(latestViewModel?.successMessage).toBe(
      "Regional finance settings updated.",
    );
    expect(latestViewModel?.activeModal).toBe(SettingsModal.None);
  });
});
