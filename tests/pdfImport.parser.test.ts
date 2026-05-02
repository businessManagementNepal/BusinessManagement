import { describe, expect, it } from "vitest";

describe("pdfImport.parser", () => {
  it("rejects arbitrary PDFs for structured business import", async () => {
    const { parsePdfImportFile } = await import(
      "@/feature/appSettings/dataTransfer/import/parser/pdfImport.parser"
    );
    const result = await parsePdfImportFile();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("PDF import");
    }
  });
});
