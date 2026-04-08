import {
  SettingsDatasourceError,
  SettingsUnknownError,
  SubmitAppRatingPayload,
  SubmitAppRatingResult,
  SubmitBugReportPayload,
  SubmitBugReportResult,
  SettingsBootstrapResult,
  SettingsOperationResult,
} from "@/feature/appSettings/settings/types/settings.types";
import { SettingsDatasource } from "../dataSource/settings.datasource";
import {
  mapAppRatingModelToEntity,
  mapBugReportModelToEntity,
  mapSettingsBootstrapRecordToEntity,
} from "./mapper/settings.mapper";
import { SettingsRepository } from "./settings.repository";

const mapDatasourceError = () => SettingsDatasourceError;

export const createSettingsRepository = (
  datasource: SettingsDatasource,
): SettingsRepository => ({
  async getSettingsBootstrap(params): Promise<SettingsBootstrapResult> {
    try {
      const result = await datasource.getSettingsBootstrap();

      if (!result.success) {
        return { success: false, error: mapDatasourceError() };
      }

      return {
        success: true,
        value: mapSettingsBootstrapRecordToEntity({
          record: result.value,
          passwordChangedAt: params.passwordChangedAt,
          lastPasswordLoginAt: params.lastPasswordLoginAt,
        }),
      };
    } catch {
      return { success: false, error: SettingsUnknownError };
    }
  },

  async updateBiometricLoginEnabled(
    enabled: boolean,
  ): Promise<SettingsOperationResult> {
    try {
      const result = await datasource.updateBiometricLoginEnabled(enabled);

      if (!result.success) {
        return { success: false, error: mapDatasourceError() };
      }

      return { success: true, value: result.value };
    } catch {
      return { success: false, error: SettingsUnknownError };
    }
  },

  async updateTwoFactorAuthEnabled(
    enabled: boolean,
  ): Promise<SettingsOperationResult> {
    try {
      const result = await datasource.updateTwoFactorAuthEnabled(enabled);

      if (!result.success) {
        return { success: false, error: mapDatasourceError() };
      }

      return { success: true, value: result.value };
    } catch {
      return { success: false, error: SettingsUnknownError };
    }
  },

  async submitBugReport(
    payload: SubmitBugReportPayload,
  ): Promise<SubmitBugReportResult> {
    try {
      const result = await datasource.submitBugReport(payload);

      if (!result.success) {
        return { success: false, error: mapDatasourceError() };
      }

      return { success: true, value: mapBugReportModelToEntity(result.value) };
    } catch {
      return { success: false, error: SettingsUnknownError };
    }
  },

  async submitAppRating(
    payload: SubmitAppRatingPayload,
  ): Promise<SubmitAppRatingResult> {
    try {
      const result = await datasource.submitAppRating({
        userRemoteId: payload.userRemoteId,
        starCount: payload.starCount,
        review: payload.review.trim() ? payload.review.trim() : null,
      });

      if (!result.success) {
        return { success: false, error: mapDatasourceError() };
      }

      return { success: true, value: mapAppRatingModelToEntity(result.value) };
    } catch {
      return { success: false, error: SettingsUnknownError };
    }
  },
});
