import { describe, expect, it, vi } from "vitest";

describe("confirmImportData.useCase", () => {
  it("imports only valid preview rows and blocks account mismatches", async () => {
    const { createConfirmImportDataUseCase } = await import(
      "@/feature/appSettings/dataTransfer/import/useCase/confirmImportData.useCase"
    );

    const importAuditRepository = {
      getImportJobByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "job-1",
          activeAccountRemoteId: "acc-1",
          activeUserRemoteId: "user-1",
          moduleId: "products" as const,
          fileName: "products.csv",
          fileFormat: "csv" as const,
          status: "preview_ready" as const,
          importMode: "skip_invalid" as const,
          totalRows: 2,
          validRows: 1,
          invalidRows: 1,
          duplicateRows: 0,
          importedRows: 0,
          skippedRows: 0,
          failedRows: 0,
          createdAt: 1,
          updatedAt: 1,
          completedAt: null,
        },
      })),
      getImportJobRowsByJobRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "row-1",
            importJobRemoteId: "job-1",
            rowNumber: 1,
            status: "valid" as const,
            rawData: {},
            normalizedData: {
              name: "Notebook",
              kind: "item",
              categoryName: null,
              salePrice: 120,
              costPrice: 80,
              openingStockQuantity: 20,
              unitLabel: "piece",
              skuOrBarcode: "NB001",
              taxRateLabel: null,
              description: null,
              status: "active",
            },
            errors: [],
            warnings: [],
            createdRecordRemoteId: null,
            createdAt: 1,
            updatedAt: 1,
          },
          {
            remoteId: "row-2",
            importJobRemoteId: "job-1",
            rowNumber: 2,
            status: "invalid" as const,
            rawData: {},
            normalizedData: {},
            errors: ["Missing name."],
            warnings: [],
            createdRecordRemoteId: null,
            createdAt: 1,
            updatedAt: 1,
          },
        ],
      })),
      updateImportJob: vi.fn(async () => ({ success: true as const, value: true })),
      updateImportJobRow: vi.fn(async () => ({ success: true as const, value: true })),
    };
    const createProductWithOpeningStockUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "prd-imported-1",
        },
      })),
    };

    const useCase = createConfirmImportDataUseCase({
      importAuditRepository: importAuditRepository as never,
      createProductWithOpeningStockUseCase:
        createProductWithOpeningStockUseCase as never,
      saveContactUseCase: { execute: vi.fn() } as never,
      saveMoneyAccountUseCase: { execute: vi.fn() } as never,
      recordAuditEventUseCase: {
        execute: vi.fn(async () => ({ success: true as const, value: true })),
      } as never,
      ensureSensitiveAccess: () => null,
      activeAccountDisplayName: "Acme Traders",
    });

    const successResult = await useCase.execute({
      importJobRemoteId: "job-1",
      activeUserRemoteId: "user-1",
      activeAccountRemoteId: "acc-1",
    });

    expect(successResult.success).toBe(true);
    if (successResult.success) {
      expect(successResult.value.importedRows).toBe(1);
      expect(successResult.value.skippedRows).toBe(1);
      expect(successResult.value.failedRows).toBe(0);
    }
    expect(createProductWithOpeningStockUseCase.execute).toHaveBeenCalledTimes(1);

    const mismatchResult = await useCase.execute({
      importJobRemoteId: "job-1",
      activeUserRemoteId: "user-1",
      activeAccountRemoteId: "acc-2",
    });

    expect(mismatchResult.success).toBe(false);
    if (!mismatchResult.success) {
      expect(mismatchResult.error.message).toContain("different account");
    }
  });
});
