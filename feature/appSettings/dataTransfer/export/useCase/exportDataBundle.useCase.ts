import { SettingsRepository } from "@/feature/appSettings/settings/data/repository/settings.repository";
import {
  AccountType,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import {
  DataTransferResult,
  DataTransferValidationError,
  ExportSettingsDataBundlePayload,
  SettingsDataTransferBundle,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

type SensitiveAccessGuard = () => string | null;

export interface ExportDataBundleUseCase {
  execute(
    payload: ExportSettingsDataBundlePayload & {
      activeUserRemoteId: string;
    },
  ): Promise<DataTransferResult<SettingsDataTransferBundle>>;
}

export const createExportDataBundleUseCase = (params: {
  settingsRepository: SettingsRepository;
  ensureSensitiveAccess: SensitiveAccessGuard;
}): ExportDataBundleUseCase => ({
  async execute(payload) {
    const sensitiveAccessMessage = params.ensureSensitiveAccess();
    if (sensitiveAccessMessage) {
      return {
        success: false,
        error: DataTransferValidationError(sensitiveAccessMessage),
      };
    }

    const activeUserRemoteId = payload.activeUserRemoteId.trim();
    const activeAccountRemoteId = payload.activeAccountRemoteId.trim();
    const moduleIds = [...new Set(payload.moduleIds)];

    if (!activeUserRemoteId) {
      return {
        success: false,
        error: DataTransferValidationError("An active user is required to export data."),
      };
    }

    if (!activeAccountRemoteId) {
      return {
        success: false,
        error: DataTransferValidationError(
          "An active account is required to export data.",
        ),
      };
    }

    if (
      payload.activeAccountType !== AccountType.Business &&
      payload.activeAccountType !== AccountType.Personal
    ) {
      return {
        success: false,
        error: DataTransferValidationError("The active account type is invalid."),
      };
    }

    if (moduleIds.length === 0) {
      return {
        success: false,
        error: DataTransferValidationError("Select at least one data group to export."),
      };
    }

    const bundleResult = await params.settingsRepository.exportDataBundle({
      moduleIds,
      activeAccountRemoteId,
      activeAccountType: payload.activeAccountType,
    });

    if (!bundleResult.success) {
      return {
        success: false,
        error: DataTransferValidationError(bundleResult.error.message),
      };
    }

    return {
      success: true,
      value: bundleResult.value,
    };
  },
});
