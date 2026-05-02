import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { SettingsDataTransferModule } from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { describe, expect, it, vi } from "vitest";

describe("previewImportData.useCase", () => {
  it("parses, validates, and persists preview rows without writing business data", async () => {
    const { createPreviewImportDataUseCase } = await import(
      "@/feature/appSettings/dataTransfer/import/useCase/previewImportData.useCase"
    );

    const parseImportFileUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          format: "csv" as const,
          fileName: "products.csv",
          sheets: [
            {
              sheetName: "Sheet1",
              rows: [
                {
                  name: "Notebook",
                  selling_price: "120",
                  opening_stock: "20",
                  unit: "piece",
                  sku: "NB001",
                },
                {
                  name: "Notebook 2",
                  selling_price: "130",
                  opening_stock: "5",
                  unit: "piece",
                  sku: "DUP001",
                },
              ],
            },
          ],
        },
      })),
    };
    const importAuditRepository = {
      createImportPreviewJob: vi.fn(async (payload) => ({
        success: true as const,
        value: {
          job: {
            remoteId: "job-1",
            activeAccountRemoteId: payload.input.activeAccountRemoteId,
            activeUserRemoteId: payload.input.activeUserRemoteId,
            moduleId: payload.input.moduleId,
            fileName: payload.input.fileName,
            fileFormat: payload.input.format,
            status: "preview_ready" as const,
            importMode: payload.importMode,
            totalRows: payload.totalRows,
            validRows: payload.validRows,
            invalidRows: payload.invalidRows,
            duplicateRows: payload.duplicateRows,
            importedRows: 0,
            skippedRows: 0,
            failedRows: 0,
            createdAt: 1,
            updatedAt: 1,
            completedAt: null,
          },
          rows: [],
        },
      })),
    };
    const getProductsUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "prd-1",
            accountRemoteId: "acc-1",
            name: "Existing",
            kind: "item" as const,
            categoryName: null,
            salePrice: 10,
            costPrice: null,
            stockQuantity: 2,
            unitLabel: "piece",
            skuOrBarcode: "DUP001",
            taxRateLabel: null,
            description: null,
            imageUrl: null,
            status: "active" as const,
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      })),
    };

    const useCase = createPreviewImportDataUseCase({
      parseImportFileUseCase: parseImportFileUseCase as never,
      importAuditRepository: importAuditRepository as never,
      getProductsUseCase: getProductsUseCase as never,
      getContactsUseCase: { execute: vi.fn() } as never,
      getMoneyAccountsUseCase: { execute: vi.fn() } as never,
      ensureSensitiveAccess: () => null,
    });

    const result = await useCase.execute({
      activeUserRemoteId: "user-1",
      activeAccountRemoteId: "acc-1",
      activeAccountType: AccountType.Business,
      moduleId: SettingsDataTransferModule.Products,
      fileUri: "file:///products.csv",
      fileName: "products.csv",
      mimeType: "text/csv",
      format: "csv",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.validRows).toBe(1);
    expect(result.value.duplicateRows).toBe(1);
    expect(importAuditRepository.createImportPreviewJob).toHaveBeenCalledTimes(1);
    expect(result.value.rowResults[1]?.status).toBe("duplicate");
  });
});
