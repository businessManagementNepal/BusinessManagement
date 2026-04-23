import { ReportExportError } from "@/feature/reports/types/report.error.types";
import { buildReportDetailHtml } from "@/feature/reports/utils/buildReportDetailHtml.util";
import { exportDocument } from "@/shared/utils/document/exportDocument";
import type { ReportDetailDocumentAdapter } from "./reportDetailDocument.adapter";

const buildFileName = (
  detail: import("@/feature/reports/types/report.entity.types").ReportDetailSnapshot,
) => {
  return `report_${detail.reportId}_${detail.periodLabel}`;
};

export const createReportDetailDocumentAdapter = (): ReportDetailDocumentAdapter => ({
  async exportDetailDocument(payload) {
    const generatedAtLabel = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = buildReportDetailHtml({
      detail: payload.detail,
      scopeLabel: payload.scopeLabel,
      generatedAtLabel,
    });

    const result = await exportDocument({
      html,
      action: payload.action,
      fileName: buildFileName(payload.detail),
      title: `${payload.detail.title} - ${payload.detail.periodLabel}`,
    });

    if (!result.success) {
      return {
        success: false,
        error: ReportExportError(result.error),
      };
    }

    return {
      success: true,
      value: true,
    };
  },
});
