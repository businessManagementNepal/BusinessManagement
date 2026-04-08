import {
  getSecurityPreferenceState,
  setBiometricLoginEnabled,
  setTwoFactorAuthEnabled,
} from "@/feature/appSettings/data/appSettings.store";
import { Result } from "@/shared/types/result.types";
import { Database } from "@nozbe/watermelondb";
import { Platform } from "react-native";
import {
  SettingsBootstrapRecord,
  SettingsDatasource,
} from "./settings.datasource";
import { BugReportModel } from "./db/bugReport.model";
import { AppRatingModel } from "./db/appRating.model";

const BUG_REPORTS_TABLE = "bug_reports";
const APP_RATINGS_TABLE = "app_ratings";

const HELP_FAQ_ITEMS = [
  { id: "invoice", question: "How do I create an invoice?" },
  { id: "product", question: "How to add a new product?" },
  { id: "emi", question: "How do I track EMI payments?" },
  { id: "export", question: "Can I export my data?" },
  { id: "switch-account", question: "How to switch between accounts?" },
] as const;

const SUPPORT_CONTACT_ITEMS = [
  { id: "email", title: "Email Support", value: "support@e-lekha.com" },
  { id: "phone", title: "Phone Support", value: "+977-01-XXXXXXX" },
] as const;

const TERMS_DOCUMENT_ITEMS = [
  {
    id: "terms-of-service",
    title: "Terms of Service",
    subtitle: "Last updated: March 2026",
  },
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    subtitle: "Last updated: March 2026",
  },
  {
    id: "data-processing-agreement",
    title: "Data Processing Agreement",
    subtitle: "GDPR & data handling",
  },
] as const;

const DATA_RIGHT_ITEMS = [
  { id: "copy", label: "Request a copy of your data" },
  { id: "delete", label: "Delete your account and data" },
  { id: "opt-out", label: "Opt out of data processing" },
  { id: "consent", label: "Update your consent preferences" },
] as const;

const normalizeRequired = (value: string): string => value.trim();
const normalizeOptional = (value: string | null | undefined): string | null => {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
};

const createLocalRemoteId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const setCreatedAndUpdatedAt = (
  record: BugReportModel | AppRatingModel,
  now: number,
) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const resolveAppVersion = (): string | null => {
  if (
    typeof process !== "undefined" &&
    typeof process.env?.EXPO_PUBLIC_APP_VERSION === "string"
  ) {
    const normalized = process.env.EXPO_PUBLIC_APP_VERSION.trim();
    return normalized.length > 0 ? normalized : null;
  }

  return null;
};

const resolveDeviceInfo = (): string | null => {
  if (
    Platform.OS === "web" &&
    typeof navigator !== "undefined" &&
    typeof navigator.userAgent === "string" &&
    navigator.userAgent.trim().length > 0
  ) {
    return navigator.userAgent.trim();
  }

  return `Platform: ${Platform.OS}`;
};

const resolveCurrentDeviceSubtitle = (): string => {
  if (Platform.OS === "web") {
    return "Current web session";
  }

  if (Platform.OS === "ios") {
    return "Current iOS device";
  }

  if (Platform.OS === "android") {
    return "Current Android device";
  }

  return `Current ${Platform.OS} session`;
};

export const createLocalSettingsDatasource = (
  database: Database,
): SettingsDatasource => ({
  async getSettingsBootstrap(): Promise<Result<SettingsBootstrapRecord>> {
    try {
      const securityPreferences = await getSecurityPreferenceState(database);

      return {
        success: true,
        value: {
          security_preferences: {
            biometric_login_enabled: securityPreferences.biometricLoginEnabled,
            two_factor_auth_enabled: securityPreferences.twoFactorAuthEnabled,
          },
          help_faq_items: [...HELP_FAQ_ITEMS],
          support_contact_items: [...SUPPORT_CONTACT_ITEMS],
          terms_document_items: [...TERMS_DOCUMENT_ITEMS],
          data_right_items: [...DATA_RIGHT_ITEMS],
          device_info: resolveDeviceInfo(),
          app_version: resolveAppVersion(),
          current_device_title: "This device",
          current_device_subtitle: resolveCurrentDeviceSubtitle(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async updateBiometricLoginEnabled(enabled: boolean): Promise<Result<boolean>> {
    try {
      await setBiometricLoginEnabled(database, enabled);
      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async updateTwoFactorAuthEnabled(enabled: boolean): Promise<Result<boolean>> {
    try {
      await setTwoFactorAuthEnabled(database, enabled);
      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async submitBugReport(payload): Promise<Result<BugReportModel>> {
    try {
      const normalizedUserRemoteId = normalizeRequired(payload.userRemoteId);
      const normalizedTitle = normalizeRequired(payload.title);
      const normalizedDescription = normalizeRequired(payload.description);

      if (!normalizedUserRemoteId) {
        throw new Error("User remote id is required");
      }

      if (!normalizedTitle) {
        throw new Error("Bug title is required");
      }

      if (!normalizedDescription) {
        throw new Error("Bug description is required");
      }

      const collection = database.get<BugReportModel>(BUG_REPORTS_TABLE);
      let created!: BugReportModel;

      await database.write(async () => {
        created = await collection.create((record) => {
          const now = Date.now();
          record.remoteId = createLocalRemoteId("bug");
          record.userRemoteId = normalizedUserRemoteId;
          record.title = normalizedTitle;
          record.description = normalizedDescription;
          record.severity = payload.severity;
          record.deviceInfo = normalizeOptional(payload.deviceInfo);
          record.appVersion = normalizeOptional(payload.appVersion);
          record.submittedAt = now;
          setCreatedAndUpdatedAt(record, now);
        });
      });

      return { success: true, value: created };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async submitAppRating(payload): Promise<Result<AppRatingModel>> {
    try {
      const normalizedUserRemoteId = normalizeRequired(payload.userRemoteId);
      const normalizedReview = normalizeOptional(payload.review);

      if (!normalizedUserRemoteId) {
        throw new Error("User remote id is required");
      }

      if (!Number.isInteger(payload.starCount) || payload.starCount < 1 || payload.starCount > 5) {
        throw new Error("Star rating must be between one and five");
      }

      const collection = database.get<AppRatingModel>(APP_RATINGS_TABLE);
      let created!: AppRatingModel;

      await database.write(async () => {
        created = await collection.create((record) => {
          const now = Date.now();
          record.remoteId = createLocalRemoteId("rating");
          record.userRemoteId = normalizedUserRemoteId;
          record.starCount = payload.starCount;
          record.review = normalizedReview;
          record.submittedAt = now;
          setCreatedAndUpdatedAt(record, now);
        });
      });

      return { success: true, value: created };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
