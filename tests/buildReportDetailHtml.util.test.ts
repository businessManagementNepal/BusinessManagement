import { ReportMenuItem } from "@/feature/reports/types/report.entity.types";
import { buildReportDetailHtml } from "@/feature/reports/utils/buildReportDetailHtml.util";
import { describe, expect, it } from "vitest";

describe("buildReportDetailHtml", () => {
  it("renders report title, summary values, and export preview safely", () => {
    const html = buildReportDetailHtml({
      scopeLabel: "Business",
      generatedAtLabel: "23 Apr 2026, 10:30",
      detail: {
        reportId: ReportMenuItem.ExportData,
        title: "Export Data",
        periodLabel: "This Week",
        summaryCards: [
          { id: "rows", label: "Rows", value: "7", tone: "neutral" },
        ],
        chartTitle: "Export Preview",
        chartSubtitle: "Same filtered query model used for exports",
        chartKind: "export-preview",
        csvPreview: "label,value\nMoney In,100\nMoney Out,30",
      },
    });

    expect(html).toContain("Export Data");
    expect(html).toContain("This Week");
    expect(html).toContain("Rows");
    expect(html).toContain("Money In,100");
  });
});
