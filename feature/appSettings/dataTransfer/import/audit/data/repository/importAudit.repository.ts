import {
  CreateImportPreviewJobPayload,
  CreateImportPreviewJobResult,
  UpdateImportJobPayload,
  UpdateImportJobRowPayload,
} from "@/feature/appSettings/dataTransfer/import/audit/types/importAudit.types";
import {
  DataTransferResult,
  ImportJob,
  ImportJobRow,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

export interface ImportAuditRepository {
  createImportPreviewJob(
    payload: CreateImportPreviewJobPayload,
  ): Promise<DataTransferResult<CreateImportPreviewJobResult>>;
  getImportJobByRemoteId(remoteId: string): Promise<DataTransferResult<ImportJob | null>>;
  getImportJobRowsByJobRemoteId(
    importJobRemoteId: string,
  ): Promise<DataTransferResult<ImportJobRow[]>>;
  updateImportJob(payload: UpdateImportJobPayload): Promise<DataTransferResult<boolean>>;
  updateImportJobRow(
    payload: UpdateImportJobRowPayload,
  ): Promise<DataTransferResult<boolean>>;
}
