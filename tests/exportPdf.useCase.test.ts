import { describe, expect, it, vi } from "vitest";

const exportDocument = vi.fn();

vi.mock("@/shared/utils/document/exportDocument", () => ({
  exportDocument,
}));

vi.mock("react-native", () => ({
  Platform: {
    OS: "web",
  },
}));

describe("exportPdf.useCase", () => {
  it("delegates PDF export through shared exportDocument", async () => {
    exportDocument.mockResolvedValue({
      success: true as const,
      uri: null,
    });

    const { createExportPdfUseCase } = await import(
      "@/feature/appSettings/dataTransfer/export/useCase/exportPdf.useCase"
    );
    const useCase = createExportPdfUseCase();
    const result = await useCase.execute({
      fileName: "export.pdf",
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
    expect(exportDocument).toHaveBeenCalledTimes(1);
    expect(exportDocument.mock.calls[0]?.[0]?.fileName).toBe("export");
  });
});
