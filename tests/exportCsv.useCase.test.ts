import { describe, expect, it, vi } from "vitest";

const saveExportFile = vi.fn();

vi.mock("@/feature/appSettings/dataTransfer/export/useCase/exportFile.shared", () => ({
  saveExportFile,
}));

describe("exportCsv.useCase", () => {
  it("builds CSV content and saves it as a text artifact", async () => {
    saveExportFile.mockResolvedValue({
      success: true as const,
      value: { fileName: "export.csv" },
    });

    const { createExportCsvUseCase } = await import(
      "@/feature/appSettings/dataTransfer/export/useCase/exportCsv.useCase"
    );
    const useCase = createExportCsvUseCase();
    const result = await useCase.execute({
      fileName: "export.csv",
      bundle: {
        title: "Export",
        exportedAt: 1,
        sheets: [
          {
            sheetName: "Products",
            columns: [{ key: "name", label: "Name" }],
            rows: [{ name: "Notebook" }],
          },
        ],
      },
    });

    expect(result.success).toBe(true);
    expect(saveExportFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "export.csv",
        mimeType: "text/csv",
        content: expect.objectContaining({
          kind: "text",
          value: expect.stringContaining("Notebook"),
        }),
      }),
    );
  });
});
