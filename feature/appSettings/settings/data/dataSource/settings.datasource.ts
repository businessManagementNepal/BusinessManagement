import { Result } from "@/shared/types/result.types";
import { AppRatingModel } from "./db/appRating.model";
import { BugReportModel } from "./db/bugReport.model";
import { BugSeverityValue } from "../../types/settings.types";

export type SecurityPreferencesRecord = {
  biometric_login_enabled: boolean;
  two_factor_auth_enabled: boolean;
};

export type HelpFaqItemRecord = {
  id: string;
  question: string;
};

export type SupportContactItemRecord = {
  id: string;
  title: string;
  value: string;
};

export type TermsDocumentItemRecord = {
  id: string;
  title: string;
  subtitle: string;
};

export type DataRightItemRecord = {
  id: string;
  label: string;
};

export type SettingsBootstrapRecord = {
  security_preferences: SecurityPreferencesRecord;
  help_faq_items: readonly HelpFaqItemRecord[];
  support_contact_items: readonly SupportContactItemRecord[];
  terms_document_items: readonly TermsDocumentItemRecord[];
  data_right_items: readonly DataRightItemRecord[];
  device_info: string | null;
  app_version: string | null;
  current_device_title: string;
  current_device_subtitle: string;
};

export interface SettingsDatasource {
  getSettingsBootstrap(): Promise<Result<SettingsBootstrapRecord>>;
  updateBiometricLoginEnabled(enabled: boolean): Promise<Result<boolean>>;
  updateTwoFactorAuthEnabled(enabled: boolean): Promise<Result<boolean>>;
  submitBugReport(payload: {
    userRemoteId: string;
    title: string;
    description: string;
    severity: BugSeverityValue;
    deviceInfo: string | null;
    appVersion: string | null;
  }): Promise<Result<BugReportModel>>;
  submitAppRating(payload: {
    userRemoteId: string;
    starCount: number;
    review: string | null;
  }): Promise<Result<AppRatingModel>>;
}
