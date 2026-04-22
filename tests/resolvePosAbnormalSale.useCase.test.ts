import { InventoryMovementSourceModule } from "@/feature/inventory/types/inventory.types";
import { createResolvePosAbnormalSaleUseCase } from "@/feature/pos/workflow/posRecovery/useCase/resolvePosAbnormalSale.useCase.impl";
import { describe, expect, it, vi } from "vitest";

describe("createResolvePosAbnormalSaleUseCase", () => {
  it("attempts inventory cleanup before accounting cleanup", async () => {
    const deleteInventoryMovementsBySourceUseCase = {
      execute: vi.fn(async () => ({ success: true as const, value: true })),
    };
    const deleteBillingDocumentUseCase = {
      execute: vi.fn(async () => ({ success: true as const, value: true })),
    };
    const deleteLedgerEntryUseCase = {
      execute: vi.fn(async () => ({ success: true as const, value: true })),
    };
    const deleteBusinessTransactionUseCase = {
      execute: vi.fn(async () => ({ success: true as const, value: true })),
    };
    const updatePosSaleWorkflowStateUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {} as never,
      })),
    };

    const useCase = createResolvePosAbnormalSaleUseCase({
      deleteInventoryMovementsBySourceUseCase:
        deleteInventoryMovementsBySourceUseCase as never,
      deleteBillingDocumentUseCase: deleteBillingDocumentUseCase as never,
      deleteLedgerEntryUseCase: deleteLedgerEntryUseCase as never,
      deleteBusinessTransactionUseCase: deleteBusinessTransactionUseCase as never,
      updatePosSaleWorkflowStateUseCase: updatePosSaleWorkflowStateUseCase as never,
    });

    await useCase.execute({
      sale: {
        remoteId: "sale-1",
        receiptNumber: "R-1",
        businessAccountRemoteId: "account-1",
        ownerUserRemoteId: "owner-1",
        idempotencyKey: "idem-1",
        workflowStatus: "failed",
        customerRemoteId: null,
        customerNameSnapshot: null,
        customerPhoneSnapshot: null,
        currencyCode: "NPR",
        countryCode: "NP",
        cartLinesSnapshot: [],
        totalsSnapshot: {
          itemCount: 1,
          gross: 100,
          discountAmount: 0,
          surchargeAmount: 0,
          taxAmount: 0,
          grandTotal: 100,
        },
        paymentParts: [],
        receipt: null,
        billingDocumentRemoteId: "doc-1",
        ledgerEntryRemoteId: "ledger-1",
        postedTransactionRemoteIds: ["txn-1"],
        lastErrorType: null,
        lastErrorMessage: null,
        createdAt: 1,
        updatedAt: 1,
      } as never,
    });

    expect(deleteInventoryMovementsBySourceUseCase.execute).toHaveBeenCalledWith({
      accountRemoteId: "account-1",
      sourceModule: InventoryMovementSourceModule.Pos,
      sourceRemoteId: "sale-1",
    });
    expect(
      deleteInventoryMovementsBySourceUseCase.execute.mock.invocationCallOrder[0],
    ).toBeLessThan(deleteLedgerEntryUseCase.execute.mock.invocationCallOrder[0]);
    expect(
      deleteInventoryMovementsBySourceUseCase.execute.mock.invocationCallOrder[0],
    ).toBeLessThan(deleteBillingDocumentUseCase.execute.mock.invocationCallOrder[0]);
  });
});
