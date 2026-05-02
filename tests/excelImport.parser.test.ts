import * as XLSX from "xlsx";
import { describe, expect, it, vi } from "vitest";

const readAsStringAsync = vi.fn();

vi.mock("expo-file-system/legacy", () => ({
  EncodingType: {
    UTF8: "utf8",
    Base64: "base64",
  },
  readAsStringAsync,
}));

describe("excelImport.parser", () => {
  it("parses rows from non-empty workbook sheets", async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ["name", "selling_price", "opening_stock"],
        ["Notebook", 120, 20],
      ]),
      "Products",
    );
    readAsStringAsync.mockResolvedValue(
      XLSX.write(workbook, {
        bookType: "xlsx",
        type: "base64",
      }),
    );

    const { parseExcelImportFile } = await import(
      "@/feature/appSettings/dataTransfer/import/parser/excelImport.parser"
    );
    const result = await parseExcelImportFile({
      fileUri: "file:///products.xlsx",
      fileName: "products.xlsx",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.sheets).toHaveLength(1);
    expect(result.value.sheets[0]?.sheetName).toBe("Products");
    expect(result.value.sheets[0]?.rows[0]).toEqual({
      name: "Notebook",
      selling_price: "120",
      opening_stock: "20",
    });
  });
});
