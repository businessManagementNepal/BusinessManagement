import type { RecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase";
import { PosSaleWorkflowStatus } from "@/feature/pos/types/posSale.constant";
import { PosErrorType } from "@/feature/pos/types/pos.error.types";
import type { PosSaleRecord } from "@/feature/pos/types/posSale.entity.types";
import type { RunPosCheckoutUseCase } from "@/feature/pos/workflow/posCheckout/useCase/runPosCheckout.useCase";
import { createRetryPosSalePostingUseCase } from "@/feature/pos/workflow/posRecovery/useCase/retryPosSalePosting.useCase.impl";
import { ProductKind } from "@/feature/products/types/product.types";
import { describe, expect, it, vi } from "vitest";

const buildSale = (overrides: Partial<PosSaleRecord> = {}): PosSaleRecord => ({
  remoteId: "sale-1",
  receiptNumber: "POS-001",
  businessAccountRemoteId: "business-1",
  ownerUserRemoteId: "owner-1",
  idempotencyKey: "idem-1",
  workflowStatus: PosSaleWorkflowStatus.PendingPosting,
  customerRemoteId: null,
  customerNameSnapshot: null,
  customerPhoneSnapshot: null,
  currencyCode: "NPR",
  countryCode: "NP",
  cartLinesSnapshot: [
    {
      lineId: "line-1",
      productId: "product-1",
      productName: "Tea",
      categoryLabel: "Beverages",
      shortCode: "TE",
      kind: ProductKind.Item,
      quantity: 1,
      unitPrice: 100,
      taxRate: 0,
      lineSubtotal: 100,
    },
  ],
  totalsSnapshot: {
    itemCount: 1,
    gross: 100,
    discountAmount: 0,
    surchargeAmount: 0,
    taxAmount: 0,
    grandTotal: 100,
  },
  paymentParts: [
    {
      paymentPartId: "part-1",
      payerLabel: null,
      amount: 100,
      settlementAccountRemoteId: "money-cash-1",
    },
  ],
  receipt: null,
  billingDocumentRemoteId: null,
  ledgerEntryRemoteId: null,
  postedTransactionRemoteIds: [],
  lastErrorType: null,
  lastErrorMessage: null,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const createRecordAuditEventUseCase = (
  execute?: RecordAuditEventUseCase["execute"],
): RecordAuditEventUseCase => ({
  execute:
    execute ??
    vi.fn(async () => ({
      success: true as const,
      value: {} as never,
    })),
});

describe("pos retry workflow audit", () => {
  it("retry success emits pos_checkout_retry_success", async () => {
    const runPosCheckoutUseCase: RunPosCheckoutUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          workflowStatus: PosSaleWorkflowStatus.Posted,
          receipt: null,
          billingDocumentRemoteId: "doc-1",
          ledgerEntryRemoteId: null,
          postedTransactionRemoteIds: ["txn-1"],
        },
      })),
    };
    const recordAuditEventUseCase = createRecordAuditEventUseCase();

    const useCase = createRetryPosSalePostingUseCase({
      runPosCheckoutUseCase,
      recordAuditEventUseCase,
    });

    const result = await useCase.execute({ sale: buildSale() });

    expect(result.success).toBe(true);
    expect(recordAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "pos_checkout_retry_success",
        outcome: "success",
      }),
    );
  });

  it("retry failure emits pos_checkout_retry_failed", async () => {
    const runPosCheckoutUseCase: RunPosCheckoutUseCase = {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "UNKNOWN" as const,
          message: "Retry failed.",
        },
      })),
    };
    const recordAuditEventUseCase = createRecordAuditEventUseCase();

    const useCase = createRetryPosSalePostingUseCase({
      runPosCheckoutUseCase,
      recordAuditEventUseCase,
    });

    const result = await useCase.execute({ sale: buildSale() });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe(PosErrorType.Unknown);
      expect(result.error.message).toBe("Retry failed.");
    }
    expect(recordAuditEventUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "pos_checkout_retry_failed",
        outcome: "failure",
      }),
    );
  });
});
