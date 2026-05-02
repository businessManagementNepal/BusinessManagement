import { BusinessExportBundle } from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

const escapeHtml = (value: unknown): string => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
};

export const buildPdfExportHtml = (bundle: BusinessExportBundle): string => {
  const renderedSheets = bundle.sheets
    .map((sheet) => {
      const headers = sheet.columns
        .map(
          (column) => `<th>${escapeHtml(column.label)}</th>`,
        )
        .join("");
      const rows = sheet.rows
        .map((row) => {
          const cells = sheet.columns
            .map((column) => `<td>${escapeHtml(row[column.key] ?? "")}</td>`)
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      return `
        <section class="sheet">
          <h2>${escapeHtml(sheet.sheetName)}</h2>
          <table>
            <thead>
              <tr>${headers}</tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>
      `;
    })
    .join("");

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: Helvetica, Arial, sans-serif;
            padding: 24px;
            color: #111827;
          }
          h1 {
            margin: 0 0 8px;
            font-size: 24px;
          }
          .meta {
            margin: 0 0 24px;
            color: #6b7280;
            font-size: 12px;
          }
          .sheet {
            margin-top: 24px;
            page-break-inside: avoid;
          }
          h2 {
            margin: 0 0 12px;
            font-size: 18px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th,
          td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
            vertical-align: top;
            font-size: 12px;
          }
          th {
            background: #f3f4f6;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(bundle.title)}</h1>
        <p class="meta">Exported ${escapeHtml(new Date(bundle.exportedAt).toLocaleString())}</p>
        ${renderedSheets}
      </body>
    </html>
  `;
};
