import { ImportAuditDatasource } from "@/feature/appSettings/dataTransfer/import/audit/data/dataSource/importAudit.datasource";
import {
  CreateImportPreviewJobPayload,
  UpdateImportJobPayload,
  UpdateImportJobRowPayload,
} from "@/feature/appSettings/dataTransfer/import/audit/types/importAudit.types";
import {
  DataTransferDatasourceError,
  DataTransferResult,
  DataTransferUnknownError,
  ImportJob,
  ImportJobRow,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { ImportAuditRepository } from "./importAudit.repository";

const mapJobModelToEntity = (
  model: import("@/feature/appSettings/dataTransfer/import/audit/data/dataSource/db/importJob.model").ImportJobModel,
): ImportJob => ({
  remoteId: model.remoteId,
  activeAccountRemoteId: model.activeAccountRemoteId,
  activeUserRemoteId: model.activeUserRemoteId,
  moduleId: model.moduleId,
  fileName: model.fileName,
  fileFormat: model.fileFormat,
  status: model.status,
  importMode: model.importMode,
  totalRows: model.totalRows,
  validRows: model.validRows,
  invalidRows: model.invalidRows,
  duplicateRows: model.duplicateRows,
  importedRows: model.importedRows,
  skippedRows: model.skippedRows,
  failedRows: model.failedRows,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
  completedAt: model.completedAt,
});

const parseRecord = (
  value: string | null,
): Record<string, unknown> | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
};

const parseStringArray = (value: string | null): string[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return [];
  }

  return [];
};

const mapRowModelToEntity = (
  model: import("@/feature/appSettings/dataTransfer/import/audit/data/dataSource/db/importJobRow.model").ImportJobRowModel,
): ImportJobRow => ({
  remoteId: model.remoteId,
  importJobRemoteId: model.importJobRemoteId,
  rowNumber: model.rowNumber,
  status: model.status,
  rawData: parseRecord(model.rawJson) ?? {},
  normalizedData: parseRecord(model.normalizedJson),
  errors: parseStringArray(model.errorJson),
  warnings: parseStringArray(model.warningJson),
  createdRecordRemoteId: model.createdRecordRemoteId,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

const mapError = (error: Error) => {
  const message = error.message.trim();
  return message ? DataTransferDatasourceError(message) : DataTransferUnknownError();
};

export const createImportAuditRepository = (
  datasource: ImportAuditDatasource,
): ImportAuditRepository => ({
  async createImportPreviewJob(
    payload: CreateImportPreviewJobPayload,
  ): Promise<DataTransferResult<import("@/feature/appSettings/dataTransfer/import/audit/types/importAudit.types").CreateImportPreviewJobResult>> {
    try {
      const result = await datasource.createImportPreviewJob(payload);
      if (!result.success) {
        return {
          success: false,
          error: mapError(result.error),
        };
      }

      return {
        success: true,
        value: result.value,
      };
    } catch {
      return {
        success: false,
        error: DataTransferUnknownError(),
      };
    }
  },

  async getImportJobByRemoteId(
    remoteId: string,
  ): Promise<DataTransferResult<ImportJob | null>> {
    try {
      const result = await datasource.getImportJobByRemoteId(remoteId);
      if (!result.success) {
        return {
          success: false,
          error: mapError(result.error),
        };
      }

      return {
        success: true,
        value: result.value ? mapJobModelToEntity(result.value) : null,
      };
    } catch {
      return {
        success: false,
        error: DataTransferUnknownError(),
      };
    }
  },

  async getImportJobRowsByJobRemoteId(
    importJobRemoteId: string,
  ): Promise<DataTransferResult<ImportJobRow[]>> {
    try {
      const result = await datasource.getImportJobRowsByJobRemoteId(
        importJobRemoteId,
      );
      if (!result.success) {
        return {
          success: false,
          error: mapError(result.error),
        };
      }

      return {
        success: true,
        value: result.value.map(mapRowModelToEntity),
      };
    } catch {
      return {
        success: false,
        error: DataTransferUnknownError(),
      };
    }
  },

  async updateImportJob(
    payload: UpdateImportJobPayload,
  ): Promise<DataTransferResult<boolean>> {
    try {
      const result = await datasource.updateImportJob(payload);
      if (!result.success) {
        return {
          success: false,
          error: mapError(result.error),
        };
      }

      return result;
    } catch {
      return {
        success: false,
        error: DataTransferUnknownError(),
      };
    }
  },

  async updateImportJobRow(
    payload: UpdateImportJobRowPayload,
  ): Promise<DataTransferResult<boolean>> {
    try {
      const result = await datasource.updateImportJobRow(payload);
      if (!result.success) {
        return {
          success: false,
          error: mapError(result.error),
        };
      }

      return result;
    } catch {
      return {
        success: false,
        error: DataTransferUnknownError(),
      };
    }
  },
});
