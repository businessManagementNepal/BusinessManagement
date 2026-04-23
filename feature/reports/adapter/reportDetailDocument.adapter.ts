import { ReportDetailSnapshot } from "@/feature/reports/types/report.entity.types";
import { ReportError } from "@/feature/reports/types/report.error.types";
import { Result } from "@/shared/types/result.types";
import { DocumentExportAction } from "@/shared/utils/document/exportDocument";

export type ExportReportDetailDocumentPayload = {
  detail: ReportDetailSnapshot;
  scopeLabel: string;
  action: DocumentExportAction;
};

export interface ReportDetailDocumentAdapter {
  exportDetailDocument(
    payload: ExportReportDetailDocumentPayload,
  ): Promise<Result<boolean, ReportError>>;
}
