import {
  ImportJob,
  ImportJobRow,
  ImportJobRowStatusValue,
  ImportJobStatusValue,
  ImportModeValue,
  ImportPreviewRowStatusValue,
  ImportRowPreview,
  ImportSettingsDataPayload,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

export type CreateImportPreviewJobPayload = {
  input: ImportSettingsDataPayload;
  importMode: ImportModeValue;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  rowResults: readonly ImportRowPreview[];
};

export type CreateImportPreviewJobResult = {
  job: ImportJob;
  rows: readonly ImportJobRow[];
};

export type UpdateImportJobPayload = {
  remoteId: string;
  status: ImportJobStatusValue;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  completedAt?: number | null;
};

export type UpdateImportJobRowPayload = {
  remoteId: string;
  status: ImportJobRowStatusValue;
  errors?: readonly string[];
  warnings?: readonly string[];
  createdRecordRemoteId?: string | null;
};

export type PersistImportRowPayload = {
  rowNumber: number;
  status: ImportPreviewRowStatusValue;
  rawData: Record<string, unknown>;
  normalizedData: Record<string, unknown>;
  errors: readonly string[];
  warnings: readonly string[];
};
