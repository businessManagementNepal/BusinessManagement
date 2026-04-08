import {
  AppRating,
  BugReport,
  DataRightItem,
  HelpFaqItem,
  SecurityPreferences,
  SettingsBootstrap,
  SecuritySessionItem,
  SupportContactItem,
  TermsDocumentItem,
} from "@/feature/appSettings/settings/types/settings.types";
import {
  DataRightItemRecord,
  HelpFaqItemRecord,
  SettingsBootstrapRecord,
  SupportContactItemRecord,
  TermsDocumentItemRecord,
} from "../../dataSource/settings.datasource";
import { AppRatingModel } from "../../dataSource/db/appRating.model";
import { BugReportModel } from "../../dataSource/db/bugReport.model";

export const mapHelpFaqRecordToEntity = (
  record: HelpFaqItemRecord,
): HelpFaqItem => ({
  id: record.id,
  question: record.question,
});

export const mapSupportContactRecordToEntity = (
  record: SupportContactItemRecord,
): SupportContactItem => ({
  id: record.id,
  title: record.title,
  value: record.value,
});

export const mapTermsDocumentRecordToEntity = (
  record: TermsDocumentItemRecord,
): TermsDocumentItem => ({
  id: record.id,
  title: record.title,
  subtitle: record.subtitle,
});

export const mapDataRightRecordToEntity = (
  record: DataRightItemRecord,
): DataRightItem => ({
  id: record.id,
  label: record.label,
});

export const mapSecurityPreferencesRecordToEntity = (
  record: SettingsBootstrapRecord["security_preferences"],
): SecurityPreferences => ({
  biometricLoginEnabled: record.biometric_login_enabled,
  twoFactorAuthEnabled: record.two_factor_auth_enabled,
});

export const createSecuritySessions = (params: {
  currentDeviceTitle: string;
  currentDeviceSubtitle: string;
  lastPasswordLoginAt: number | null;
}): readonly SecuritySessionItem[] => {
  const items: SecuritySessionItem[] = [
    {
      id: "current-device",
      title: params.currentDeviceTitle,
      subtitle: params.currentDeviceSubtitle,
      activityLabel: "Active now",
      isActive: true,
    },
  ];

  if (params.lastPasswordLoginAt !== null) {
    items.push({
      id: "last-password-login",
      title: "Last password login",
      subtitle: "Recent successful password sign in",
      activityLabel: new Date(params.lastPasswordLoginAt).toISOString().slice(0, 16).replace("T", " "),
      isActive: false,
    });
  }

  return items;
};

export const mapSettingsBootstrapRecordToEntity = (params: {
  record: SettingsBootstrapRecord;
  passwordChangedAt: number | null;
  lastPasswordLoginAt: number | null;
}): SettingsBootstrap => ({
  securityPreferences: mapSecurityPreferencesRecordToEntity(
    params.record.security_preferences,
  ),
  helpFaqItems: params.record.help_faq_items.map(mapHelpFaqRecordToEntity),
  supportContactItems: params.record.support_contact_items.map(
    mapSupportContactRecordToEntity,
  ),
  termsDocumentItems: params.record.terms_document_items.map(
    mapTermsDocumentRecordToEntity,
  ),
  dataRightItems: params.record.data_right_items.map(mapDataRightRecordToEntity),
  deviceInfo: params.record.device_info,
  appVersion: params.record.app_version,
  securitySessions: createSecuritySessions({
    currentDeviceTitle: params.record.current_device_title,
    currentDeviceSubtitle: params.record.current_device_subtitle,
    lastPasswordLoginAt: params.lastPasswordLoginAt,
  }),
  passwordChangedAt: params.passwordChangedAt,
  lastPasswordLoginAt: params.lastPasswordLoginAt,
});

export const mapBugReportModelToEntity = (model: BugReportModel): BugReport => ({
  remoteId: model.remoteId,
  userRemoteId: model.userRemoteId,
  title: model.title,
  description: model.description,
  severity: model.severity,
  deviceInfo: model.deviceInfo,
  appVersion: model.appVersion,
  submittedAt: model.submittedAt,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

export const mapAppRatingModelToEntity = (model: AppRatingModel): AppRating => ({
  remoteId: model.remoteId,
  userRemoteId: model.userRemoteId,
  starCount: model.starCount,
  review: model.review,
  submittedAt: model.submittedAt,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});
