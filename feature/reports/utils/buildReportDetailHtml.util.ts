import {
  ReportDetailSnapshot,
  ReportDualSeriesPoint,
  ReportListItem,
  ReportSegment,
  ReportSeriesPoint,
  ReportSummaryCard,
} from "@/feature/reports/types/report.entity.types";

type BuildReportDetailHtmlParams = {
  detail: ReportDetailSnapshot;
  scopeLabel: string;
  generatedAtLabel: string;
};

const escapeHtml = (value: string): string => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const renderSummaryCards = (cards: readonly ReportSummaryCard[]): string => {
  return cards
    .map(
      (card) => `
        <div class="summary-card">
          <div class="summary-label">${escapeHtml(card.label)}</div>
          <div class="summary-value">${escapeHtml(card.value)}</div>
        </div>
      `,
    )
    .join("");
};

const renderSeriesTable = (
  rows: readonly ReportSeriesPoint[],
  valueHeader: string,
): string => {
  return `
    <table>
      <thead>
        <tr>
          <th>Label</th>
          <th>${escapeHtml(valueHeader)}</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.label)}</td>
                <td>${escapeHtml(String(row.value))}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
};

const renderDualSeriesTable = (rows: readonly ReportDualSeriesPoint[]): string => {
  return `
    <table>
      <thead>
        <tr>
          <th>Label</th>
          <th>Primary</th>
          <th>Secondary</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.label)}</td>
                <td>${escapeHtml(String(row.primaryValue))}</td>
                <td>${escapeHtml(String(row.secondaryValue))}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
};

const renderSegmentTable = (rows: readonly ReportSegment[]): string => {
  return `
    <table>
      <thead>
        <tr>
          <th>Label</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.label)}</td>
                <td>${escapeHtml(String(row.value))}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
};

const renderListTable = (rows: readonly ReportListItem[]): string => {
  return `
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Subtitle</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.title)}</td>
                <td>${escapeHtml(row.subtitle)}</td>
                <td>${escapeHtml(row.value)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
};

const renderBody = (detail: ReportDetailSnapshot): string => {
  switch (detail.chartKind) {
    case "line":
      return detail.lineSeries
        ? renderSeriesTable(detail.lineSeries, "Value")
        : "<p>No line data available.</p>";

    case "bars":
      return detail.barSeries
        ? renderSeriesTable(detail.barSeries, "Value")
        : "<p>No bar data available.</p>";

    case "dual-line":
      return detail.dualSeries
        ? renderDualSeriesTable(detail.dualSeries)
        : "<p>No dual-series data available.</p>";

    case "semi-donut": {
      const segmentMarkup = detail.segments
        ? renderSegmentTable(detail.segments)
        : "<p>No segment data available.</p>";

      const listMarkup = detail.listItems
        ? renderListTable(detail.listItems)
        : "";

      return `${segmentMarkup}${listMarkup}`;
    }

    case "list":
    case "progress-list":
      return detail.listItems
        ? renderListTable(detail.listItems)
        : "<p>No list data available.</p>";

    case "export-preview":
      return detail.csvPreview
        ? `<pre>${escapeHtml(detail.csvPreview)}</pre>`
        : "<p>No export preview available.</p>";

    default:
      return "<p>No report data available.</p>";
  }
};

export const buildReportDetailHtml = ({
  detail,
  scopeLabel,
  generatedAtLabel,
}: BuildReportDetailHtmlParams): string => {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(detail.title)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #1b1b1b;
            padding: 24px;
          }
          h1 {
            margin: 0 0 8px;
            font-size: 24px;
          }
          .meta {
            color: #555;
            font-size: 12px;
            margin-bottom: 20px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 20px;
          }
          .summary-card {
            border: 1px solid #d9d9d9;
            border-radius: 10px;
            padding: 12px;
          }
          .summary-label {
            color: #555;
            font-size: 12px;
            margin-bottom: 6px;
          }
          .summary-value {
            font-size: 18px;
            font-weight: 700;
          }
          h2 {
            font-size: 18px;
            margin: 0 0 6px;
          }
          .subtitle {
            color: #555;
            font-size: 12px;
            margin-bottom: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          th, td {
            border: 1px solid #d9d9d9;
            padding: 8px;
            text-align: left;
            font-size: 12px;
          }
          th {
            background: #f5f5f5;
          }
          pre {
            background: #f7f7f7;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #d9d9d9;
            white-space: pre-wrap;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(detail.title)}</h1>
        <div class="meta">
          Scope: ${escapeHtml(scopeLabel)}<br />
          Period: ${escapeHtml(detail.periodLabel)}<br />
          Generated: ${escapeHtml(generatedAtLabel)}
        </div>

        <div class="summary-grid">
          ${renderSummaryCards(detail.summaryCards)}
        </div>

        <section>
          <h2>${escapeHtml(detail.chartTitle)}</h2>
          <div class="subtitle">${escapeHtml(detail.chartSubtitle)}</div>
          ${renderBody(detail)}
        </section>
      </body>
    </html>
  `;
};
