import { describe, expect, it, vi } from "vitest";

const readAsStringAsync = vi.fn();

vi.mock("expo-file-system/legacy", () => ({
  EncodingType: {
    UTF8: "utf8",
    Base64: "base64",
  },
  readAsStringAsync,
}));

describe("csvImport.parser", () => {
  it("parses normalized CSV rows", async () => {
    readAsStringAsync.mockResolvedValue(
      "name, selling_price, opening_stock\nNotebook,120,20\nPen,15,",
    );

    const { parseCsvImportFile } = await import(
      "@/feature/appSettings/dataTransfer/import/parser/csvImport.parser"
    );
    const result = await parseCsvImportFile({
      fileUri: "file:///products.csv",
      fileName: "products.csv",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.sheets[0]?.rows).toEqual([
      {
        name: "Notebook",
        selling_price: "120",
        opening_stock: "20",
      },
      {
        name: "Pen",
        selling_price: "15",
        opening_stock: null,
      },
    ]);
  });
});
