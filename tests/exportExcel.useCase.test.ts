import { describe, expect, it, vi } from "vitest";

const saveExportFile = vi.fn();

vi.mock("@/feature/appSettings/dataTransfer/export/useCase/exportFile.shared", () => ({
  saveExportFile,
}));

describe("exportExcel.useCase", () => {
  it("builds an xlsx artifact and saves it as base64", async () => {
    saveExportFile.mockResolvedValue({
      success: true as const,
      value: { fileName: "export.xlsx" },
    });

    const { createExportExcelUseCase } = await import(
      "@/feature/appSettings/dataTransfer/export/useCase/exportExcel.useCase"
    );
    const useCase = createExportExcelUseCase();
    await useCase.execute({
      fileName: "export.xlsx",
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

    expect(saveExportFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "export.xlsx",
        content: expect.objectContaining({
          kind: "base64",
        }),
      }),
    );
  });
});
