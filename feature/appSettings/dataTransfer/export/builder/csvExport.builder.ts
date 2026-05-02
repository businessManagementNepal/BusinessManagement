import { BusinessExportBundle } from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = String(value).replace(/\r?\n/g, "\\n");
  if (
    normalized.includes(",") ||
    normalized.includes("\"") ||
    normalized.includes("\n")
  ) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }

  return normalized;
};

const toCsvLine = (values: readonly unknown[]): string => {
  return values.map((value) => escapeCsvValue(value)).join(",");
};

export const buildCsvExport = (bundle: BusinessExportBundle): string => {
  const lines: string[] = [
    `# title=${bundle.title}`,
    `# exported_at=${new Date(bundle.exportedAt).toISOString()}`,
    "",
  ];

  for (const sheet of bundle.sheets) {
    lines.push(`# sheet=${sheet.sheetName}`);
    lines.push(toCsvLine(sheet.columns.map((column) => column.label)));

    for (const row of sheet.rows) {
      lines.push(
        toCsvLine(sheet.columns.map((column) => row[column.key] ?? "")),
      );
    }

    lines.push("");
  }

  return lines.join("\n");
};
