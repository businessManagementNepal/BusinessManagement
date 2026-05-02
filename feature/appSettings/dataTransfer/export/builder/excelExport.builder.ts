import * as XLSX from "xlsx";
import { BusinessExportBundle } from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";

export const buildExcelExportBase64 = (
  bundle: BusinessExportBundle,
): string => {
  const workbook = XLSX.utils.book_new();

  for (const sheet of bundle.sheets) {
    const matrix = [
      sheet.columns.map((column) => column.label),
      ...sheet.rows.map((row) =>
        sheet.columns.map((column) => row[column.key] ?? ""),
      ),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(matrix);
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheet.sheetName.slice(0, 31) || "Sheet",
    );
  }

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "base64",
  });
};
