import { ReportDetailSnapshot } from "@/feature/reports/types/report.entity.types";
import { ReportError } from "@/feature/reports/types/report.error.types";
import { Result } from "@/shared/types/result.types";
import { DocumentExportAction } from "@/shared/utils/document/exportDocument";

export type ExportReportDetailDocumentParams = {
  detail: ReportDetailSnapshot;
  scopeLabel: string;
  action: DocumentExportAction;
};

export interface ExportReportDetailDocumentUseCase {
  execute(
    params: ExportReportDetailDocumentParams,
  ): Promise<Result<boolean, ReportError>>;
}
