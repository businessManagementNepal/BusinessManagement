import {
  CreateImportPreviewJobPayload,
  CreateImportPreviewJobResult,
  UpdateImportJobPayload,
  UpdateImportJobRowPayload,
} from "@/feature/appSettings/dataTransfer/import/audit/types/importAudit.types";
import {
  ImportJob,
  ImportJobRow,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import { ImportAuditDatasource } from "./importAudit.datasource";
import { ImportJobModel } from "./db/importJob.model";
import { ImportJobRowModel } from "./db/importJobRow.model";

const IMPORT_JOBS_TABLE = "import_jobs";
const IMPORT_JOB_ROWS_TABLE = "import_job_rows";

type TimestampWritableModel = {
  _raw: Record<string, number | string | null>;
};

const setCreatedAndUpdatedAt = (
  record: TimestampWritableModel,
  now: number,
): void => {
  record._raw["created_at"] = now;
  record._raw["updated_at"] = now;
};

const setUpdatedAt = (record: TimestampWritableModel, now: number): void => {
  record._raw["updated_at"] = now;
};

const createRemoteId = (prefix: string): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return `${prefix}-${randomId}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const mapJobModelToEntity = (model: ImportJobModel): ImportJob => ({
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

const parseJsonRecord = (
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

const mapRowModelToEntity = (model: ImportJobRowModel): ImportJobRow => ({
  remoteId: model.remoteId,
  importJobRemoteId: model.importJobRemoteId,
  rowNumber: model.rowNumber,
  status: model.status,
  rawData: parseJsonRecord(model.rawJson) ?? {},
  normalizedData: parseJsonRecord(model.normalizedJson),
  errors: parseStringArray(model.errorJson),
  warnings: parseStringArray(model.warningJson),
  createdRecordRemoteId: model.createdRecordRemoteId,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

const serializeJson = (value: unknown): string => JSON.stringify(value);

export const createLocalImportAuditDatasource = (
  database: Database,
): ImportAuditDatasource => ({
  async createImportPreviewJob(
    payload: CreateImportPreviewJobPayload,
  ): Promise<Result<CreateImportPreviewJobResult>> {
    try {
      const jobsCollection = database.get<ImportJobModel>(IMPORT_JOBS_TABLE);
      const rowsCollection = database.get<ImportJobRowModel>(IMPORT_JOB_ROWS_TABLE);
      const jobRemoteId = createRemoteId("import-job");
      let createdJob!: ImportJobModel;
      const createdRows: ImportJobRowModel[] = [];

      await database.write(async () => {
        createdJob = await jobsCollection.create((record) => {
          const now = Date.now();
          record.remoteId = jobRemoteId;
          record.activeAccountRemoteId = payload.input.activeAccountRemoteId;
          record.activeUserRemoteId = payload.input.activeUserRemoteId;
          record.moduleId = payload.input.moduleId;
          record.fileName = payload.input.fileName;
          record.fileFormat = payload.input.format;
          record.status = "preview_ready";
          record.importMode = payload.importMode;
          record.totalRows = payload.totalRows;
          record.validRows = payload.validRows;
          record.invalidRows = payload.invalidRows;
          record.duplicateRows = payload.duplicateRows;
          record.importedRows = 0;
          record.skippedRows = 0;
          record.failedRows = 0;
          record.completedAt = null;
          setCreatedAndUpdatedAt(record as unknown as TimestampWritableModel, now);
        });

        for (const rowResult of payload.rowResults) {
          const createdRow = await rowsCollection.create((record) => {
            const now = Date.now();
            record.remoteId = createRemoteId("import-row");
            record.importJobRemoteId = jobRemoteId;
            record.rowNumber = rowResult.rowNumber;
            record.status = rowResult.status;
            record.rawJson = serializeJson(rowResult.normalizedData);
            record.normalizedJson = serializeJson(rowResult.normalizedData);
            record.errorJson = rowResult.errors.length
              ? serializeJson(rowResult.errors)
              : null;
            record.warningJson = rowResult.warnings.length
              ? serializeJson(rowResult.warnings)
              : null;
            record.createdRecordRemoteId = null;
            setCreatedAndUpdatedAt(
              record as unknown as TimestampWritableModel,
              now,
            );
          });

          createdRows.push(createdRow);
        }
      });

      return {
        success: true,
        value: {
          job: mapJobModelToEntity(createdJob),
          rows: createdRows.map(mapRowModelToEntity),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getImportJobByRemoteId(
    remoteId: string,
  ): Promise<Result<ImportJobModel | null>> {
    try {
      const collection = database.get<ImportJobModel>(IMPORT_JOBS_TABLE);
      const matching = await collection
        .query(Q.where("remote_id", remoteId.trim()))
        .fetch();

      return {
        success: true,
        value: matching[0] ?? null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getImportJobRowsByJobRemoteId(
    importJobRemoteId: string,
  ): Promise<Result<ImportJobRowModel[]>> {
    try {
      const collection = database.get<ImportJobRowModel>(IMPORT_JOB_ROWS_TABLE);
      const rows = await collection
        .query(
          Q.where("import_job_remote_id", importJobRemoteId.trim()),
          Q.sortBy("row_number", Q.asc),
        )
        .fetch();

      return {
        success: true,
        value: rows,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async updateImportJob(payload: UpdateImportJobPayload): Promise<Result<boolean>> {
    try {
      const collection = database.get<ImportJobModel>(IMPORT_JOBS_TABLE);
      const matching = await collection
        .query(Q.where("remote_id", payload.remoteId.trim()))
        .fetch();
      const existingJob = matching[0] ?? null;

      if (!existingJob) {
        throw new Error("Import job not found.");
      }

      await database.write(async () => {
        await existingJob.update((record) => {
          record.status = payload.status;
          record.importedRows = payload.importedRows;
          record.skippedRows = payload.skippedRows;
          record.failedRows = payload.failedRows;
          record.completedAt =
            payload.completedAt === undefined ? record.completedAt : payload.completedAt;
          setUpdatedAt(record as unknown as TimestampWritableModel, Date.now());
        });
      });

      return {
        success: true,
        value: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async updateImportJobRow(
    payload: UpdateImportJobRowPayload,
  ): Promise<Result<boolean>> {
    try {
      const collection = database.get<ImportJobRowModel>(IMPORT_JOB_ROWS_TABLE);
      const matching = await collection
        .query(Q.where("remote_id", payload.remoteId.trim()))
        .fetch();
      const existingRow = matching[0] ?? null;

      if (!existingRow) {
        throw new Error("Import job row not found.");
      }

      await database.write(async () => {
        await existingRow.update((record) => {
          record.status = payload.status;
          record.errorJson = payload.errors?.length
            ? serializeJson(payload.errors)
            : null;
          record.warningJson = payload.warnings?.length
            ? serializeJson(payload.warnings)
            : null;
          if (payload.createdRecordRemoteId !== undefined) {
            record.createdRecordRemoteId = payload.createdRecordRemoteId;
          }
          setUpdatedAt(record as unknown as TimestampWritableModel, Date.now());
        });
      });

      return {
        success: true,
        value: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
