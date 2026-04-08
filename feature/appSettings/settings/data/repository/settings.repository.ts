import {
  SettingsBootstrapResult,
  SettingsOperationResult,
  SubmitAppRatingPayload,
  SubmitAppRatingResult,
  SubmitBugReportPayload,
  SubmitBugReportResult,
} from "@/feature/appSettings/settings/types/settings.types";

export interface SettingsRepository {
  getSettingsBootstrap(params: {
    passwordChangedAt: number | null;
    lastPasswordLoginAt: number | null;
  }): Promise<SettingsBootstrapResult>;
  updateBiometricLoginEnabled(enabled: boolean): Promise<SettingsOperationResult>;
  updateTwoFactorAuthEnabled(enabled: boolean): Promise<SettingsOperationResult>;
  submitBugReport(payload: SubmitBugReportPayload): Promise<SubmitBugReportResult>;
  submitAppRating(payload: SubmitAppRatingPayload): Promise<SubmitAppRatingResult>;
}
