import { SETTINGS_SUPPORT_EMAIL } from "@/feature/appSettings/settings/constants/settings.constants";
import {
  SettingsValidationError,
  SettingsOperationResult,
} from "@/feature/appSettings/settings/types/settings.types";
import { Linking } from "react-native";
import {
  OpenBugReportEmailPayload,
  OpenBugReportEmailUseCase,
} from "./openBugReportEmail.useCase";

export const NO_EMAIL_APP_AVAILABLE_MESSAGE =
  `No email app is available. Contact ${SETTINGS_SUPPORT_EMAIL} manually.`;

type EmailLinking = {
  canOpenURL(url: string): Promise<boolean>;
  openURL(url: string): Promise<unknown>;
};

const defaultEmailLinking: EmailLinking = {
  canOpenURL: (url) => Linking.canOpenURL(url),
  openURL: (url) => Linking.openURL(url),
};

const normalizeMetadata = (value: string | null): string => {
  const normalizedValue = value?.trim();
  return normalizedValue || "Unavailable";
};

const formatSeverity = (
  severity: OpenBugReportEmailPayload["severity"],
): string => `${severity.charAt(0).toUpperCase()}${severity.slice(1)}`;

export const buildBugReportEmailUri = (
  payload: OpenBugReportEmailPayload,
): string => {
  const title = payload.title.trim();
  const description = payload.description.trim();
  const subject = `eLekha Bug Report: ${title}`;
  const body = [
    "Hello eLekha Support,",
    "",
    "I would like to report an issue with eLekha.",
    "",
    "Bug title:",
    title,
    "",
    "Severity:",
    formatSeverity(payload.severity),
    "",
    "Description:",
    description,
    "",
    "App version:",
    normalizeMetadata(payload.appVersion),
    "",
    "Platform/device:",
    normalizeMetadata(payload.deviceInfo),
    "",
    "Please let me know if you need any additional information.",
    "",
    "The user may edit this message before sending.",
  ].join("\n");

  return `mailto:${SETTINGS_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export const createOpenBugReportEmailUseCase = (
  emailLinking: EmailLinking = defaultEmailLinking,
): OpenBugReportEmailUseCase => ({
  async execute(
    payload: OpenBugReportEmailPayload,
  ): Promise<SettingsOperationResult> {
    if (!payload.title.trim()) {
      return {
        success: false,
        error: SettingsValidationError("Bug title is required."),
      };
    }

    if (!payload.description.trim()) {
      return {
        success: false,
        error: SettingsValidationError("Describe the issue before emailing."),
      };
    }

    const emailUri = buildBugReportEmailUri(payload);

    try {
      const canOpenEmail = await emailLinking.canOpenURL(emailUri);
      if (!canOpenEmail) {
        return {
          success: false,
          error: SettingsValidationError(NO_EMAIL_APP_AVAILABLE_MESSAGE),
        };
      }

      await emailLinking.openURL(emailUri);
      return { success: true, value: true };
    } catch {
      return {
        success: false,
        error: SettingsValidationError(NO_EMAIL_APP_AVAILABLE_MESSAGE),
      };
    }
  },
});
