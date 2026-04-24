import { PosErrorType } from "@/feature/pos/types/pos.error.types";
import { createResolvePosAbnormalSaleUseCase } from "@/feature/pos/workflow/posRecovery/useCase/resolvePosAbnormalSale.useCase.impl";
import { describe, expect, it, vi } from "vitest";

const buildSale = (overrides: Record<string, unknown> = {}) => ({
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
  ...overrides,
});

describe("pos recovery audit", () => {
  it("successful cleanup emits pos_abnormal_cleanup audit with Success outcome", async () => {
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
    const recordAuditEventUseCase = {
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
      deleteBusinessTransactionUseCase:
        deleteBusinessTransactionUseCase as never,
      updatePosSaleWorkflowStateUseCase:
        updatePosSaleWorkflowStateUseCase as never,
      recordAuditEventUseCase: recordAuditEventUseCase as never,
    });

    const result = await useCase.execute({ sale: buildSale() as never });

    expect(result).toEqual({
      success: true,
      value: {
        wasFullyCleaned: true,
      },
    });
    expect(recordAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "pos_abnormal_cleanup",
        outcome: "success",
      }),
    );
  });

  it("partial cleanup emits audit with Partial outcome and remaining refs", async () => {
    const deleteInventoryMovementsBySourceUseCase = {
      execute: vi.fn(async () => ({ success: true as const, value: true })),
    };
    const deleteBillingDocumentUseCase = {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "UNKNOWN",
          message: "Delete failed.",
        },
      })),
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
    const recordAuditEventUseCase = {
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
      deleteBusinessTransactionUseCase:
        deleteBusinessTransactionUseCase as never,
      updatePosSaleWorkflowStateUseCase:
        updatePosSaleWorkflowStateUseCase as never,
      recordAuditEventUseCase: recordAuditEventUseCase as never,
    });

    const result = await useCase.execute({ sale: buildSale() as never });
    const auditPayload = (
      recordAuditEventUseCase.execute as ReturnType<typeof vi.fn>
    ).mock.calls[0]?.[0] as {
      outcome: string;
      metadataJson: string;
    } | undefined;
    expect(auditPayload).toBeDefined();
    if (!auditPayload) {
      return;
    }
    const metadata = JSON.parse(auditPayload.metadataJson) as {
      remainingBillingDocumentRemoteId: string | null;
    };

    expect(result).toEqual({
      success: true,
      value: {
        wasFullyCleaned: false,
      },
    });
    expect(auditPayload.outcome).toBe("partial");
    expect(metadata.remainingBillingDocumentRemoteId).toBe("doc-1");
  });

  it("audit failure after cleanup returns failure", async () => {
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
    const recordAuditEventUseCase = {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "DATABASE",
          message: "Unable to save audit event.",
        },
      })),
    };
    const useCase = createResolvePosAbnormalSaleUseCase({
      deleteInventoryMovementsBySourceUseCase:
        deleteInventoryMovementsBySourceUseCase as never,
      deleteBillingDocumentUseCase: deleteBillingDocumentUseCase as never,
      deleteLedgerEntryUseCase: deleteLedgerEntryUseCase as never,
      deleteBusinessTransactionUseCase:
        deleteBusinessTransactionUseCase as never,
      updatePosSaleWorkflowStateUseCase:
        updatePosSaleWorkflowStateUseCase as never,
      recordAuditEventUseCase: recordAuditEventUseCase as never,
    });

    const result = await useCase.execute({ sale: buildSale() as never });

    expect(result).toEqual({
      success: false,
      error: {
        type: PosErrorType.Unknown,
        message: "Unable to save audit event.",
      },
    });
  });
});
