import { SettingsRepository } from "@/feature/appSettings/settings/data/repository/settings.repository";
import {
  SettingsDataTransferFormat,
  SettingsValidationError,
} from "@/feature/appSettings/settings/types/settings.types";
import { buildBusinessExportBundle } from "@/feature/appSettings/dataTransfer/export/useCase/exportBusinessBundle.shared";
import { createExportCsvUseCase } from "@/feature/appSettings/dataTransfer/export/useCase/exportCsv.useCase";
import { createExportDataBundleUseCase } from "@/feature/appSettings/dataTransfer/export/useCase/exportDataBundle.useCase";
import { createExportExcelUseCase } from "@/feature/appSettings/dataTransfer/export/useCase/exportExcel.useCase";
import { saveExportFile } from "@/feature/appSettings/dataTransfer/export/useCase/exportFile.shared";
import { createExportPdfUseCase } from "@/feature/appSettings/dataTransfer/export/useCase/exportPdf.useCase";
import { ExportSettingsDataPayload, ExportSettingsDataUseCase } from "./exportSettingsData.useCase";

const buildFileStamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const pad = (value: number): string => value.toString().padStart(2, "0");

  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate(),
  )}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(
    date.getSeconds(),
  )}`;
};

const countExportedRows = (
  bundle: import("@/feature/appSettings/dataTransfer/types/dataTransfer.types").SettingsDataTransferBundle,
): number => {
  return bundle.modules.reduce((moduleTotal, moduleItem) => {
    const moduleRowCount = moduleItem.tables.reduce((tableTotal, table) => {
      return tableTotal + table.rows.length;
    }, 0);

    return moduleTotal + moduleRowCount;
  }, 0);
};

type CreateExportSettingsDataUseCaseParams =
  | SettingsRepository
  | {
      settingsRepository: SettingsRepository;
      ensureSensitiveAccess?: () => string | null;
    };

const resolveParams = (
  params: CreateExportSettingsDataUseCaseParams,
): {
  settingsRepository: SettingsRepository;
  ensureSensitiveAccess: () => string | null;
} => {
  if ("exportDataBundle" in params) {
    return {
      settingsRepository: params,
      ensureSensitiveAccess: () => null,
    };
  }

  return {
    settingsRepository: params.settingsRepository,
    ensureSensitiveAccess: params.ensureSensitiveAccess ?? (() => null),
  };
};

export const createExportSettingsDataUseCase = (
  params: CreateExportSettingsDataUseCaseParams,
): ExportSettingsDataUseCase => {
  const { settingsRepository, ensureSensitiveAccess } = resolveParams(params);
  const exportBundleUseCase = createExportDataBundleUseCase({
    settingsRepository,
    ensureSensitiveAccess,
  });
  const exportCsvUseCase = createExportCsvUseCase();
  const exportExcelUseCase = createExportExcelUseCase();
  const exportPdfUseCase = createExportPdfUseCase();

  return {
    async execute(payload: ExportSettingsDataPayload) {
      const bundleResult = await exportBundleUseCase.execute({
        activeUserRemoteId: payload.activeUserRemoteId,
        activeAccountRemoteId: payload.activeAccountRemoteId,
        activeAccountType: payload.activeAccountType,
        moduleIds: payload.moduleIds,
      });

      if (!bundleResult.success) {
        return {
          success: false,
          error: SettingsValidationError(bundleResult.error.message),
        };
      }

      const timestamp = Date.now();
      const fileStamp = buildFileStamp(timestamp);
      const exportedModuleCount = bundleResult.value.modules.length;
      const exportedRowCount = countExportedRows(bundleResult.value);

      if (payload.format === SettingsDataTransferFormat.Json) {
        const fileName = `elekha-backup-${fileStamp}.json`;
        const jsonResult = await saveExportFile({
          fileName,
          mimeType: "application/json",
          content: {
            kind: "text",
            value: JSON.stringify(bundleResult.value, null, 2),
          },
          dialogTitle: "Export Data",
          uti: "public.json",
        });

        if (!jsonResult.success) {
          return {
            success: false,
            error: SettingsValidationError(jsonResult.error.message),
          };
        }

        return {
          success: true,
          value: {
            fileName,
            exportedModuleCount,
            exportedRowCount,
          },
        };
      }

      const businessBundle = buildBusinessExportBundle(bundleResult.value);

      if (payload.format === SettingsDataTransferFormat.Csv) {
        const fileName = `elekha-export-${fileStamp}.csv`;
        const exportResult = await exportCsvUseCase.execute({
          bundle: businessBundle,
          fileName,
        });
        if (!exportResult.success) {
          return {
            success: false,
            error: SettingsValidationError(exportResult.error.message),
          };
        }

        return {
          success: true,
          value: {
            fileName,
            exportedModuleCount,
            exportedRowCount,
          },
        };
      }

      if (payload.format === SettingsDataTransferFormat.Excel) {
        const fileName = `elekha-export-${fileStamp}.xlsx`;
        const exportResult = await exportExcelUseCase.execute({
          bundle: businessBundle,
          fileName,
        });
        if (!exportResult.success) {
          return {
            success: false,
            error: SettingsValidationError(exportResult.error.message),
          };
        }

        return {
          success: true,
          value: {
            fileName,
            exportedModuleCount,
            exportedRowCount,
          },
        };
      }

      const fileName = `elekha-export-${fileStamp}.pdf`;
      const exportResult = await exportPdfUseCase.execute({
        bundle: businessBundle,
        fileName,
      });
      if (!exportResult.success) {
        return {
          success: false,
          error: SettingsValidationError(exportResult.error.message),
        };
      }

      return {
        success: true,
        value: {
          fileName,
          exportedModuleCount,
          exportedRowCount,
        },
      };
    },
  };
};
