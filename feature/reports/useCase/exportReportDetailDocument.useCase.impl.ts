import { ReportDetailDocumentAdapter } from "@/feature/reports/adapter/reportDetailDocument.adapter";
import { ExportReportDetailDocumentUseCase } from "./exportReportDetailDocument.useCase";

export const createExportReportDetailDocumentUseCase = (
  adapter: ReportDetailDocumentAdapter,
): ExportReportDetailDocumentUseCase => ({
  async execute(params) {
    return adapter.exportDetailDocument(params);
  },
});
