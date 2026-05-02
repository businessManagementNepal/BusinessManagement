import {
  CreateImportPreviewJobPayload,
  CreateImportPreviewJobResult,
  UpdateImportJobPayload,
  UpdateImportJobRowPayload,
} from "@/feature/appSettings/dataTransfer/import/audit/types/importAudit.types";
import { Result } from "@/shared/types/result.types";
import { ImportJobModel } from "./db/importJob.model";
import { ImportJobRowModel } from "./db/importJobRow.model";

export interface ImportAuditDatasource {
  createImportPreviewJob(
    payload: CreateImportPreviewJobPayload,
  ): Promise<Result<CreateImportPreviewJobResult>>;
  getImportJobByRemoteId(
    remoteId: string,
  ): Promise<Result<ImportJobModel | null>>;
  getImportJobRowsByJobRemoteId(
    importJobRemoteId: string,
  ): Promise<Result<ImportJobRowModel[]>>;
  updateImportJob(payload: UpdateImportJobPayload): Promise<Result<boolean>>;
  updateImportJobRow(
    payload: UpdateImportJobRowPayload,
  ): Promise<Result<boolean>>;
}
