import { ProductKind } from "@/feature/products/types/product.types";
import { PosCheckoutWorkflowStatus } from "@/feature/pos/workflow/posCheckout/types/posCheckout.state.types";
import { buildPosCartLine, buildPosTotals } from "@/tests/helpers/posTestBuilders";
import {
  CUSTOMER,
  createCheckoutHarness,
  createRunParams,
} from "@/tests/helpers/posCheckoutIntegration.helper";
import { describe, expect, it, vi } from "vitest";

const PARTIAL_TOTALS = buildPosTotals({
  itemCount: 1,
  gross: 1000,
  taxAmount: 0,
  grandTotal: 1000,
});

const PARTIAL_CART_LINES = [
  buildPosCartLine({
    lineId: "line-1",
    productId: "product-1",
    productName: "Rice Bag",
    categoryLabel: "Groceries",
    shortCode: "RB",
    kind: ProductKind.Item,
    quantity: 1,
    unitPrice: 1000,
    taxRate: 0,
    lineSubtotal: 1000,
  }),
];

describe("posCheckoutFailure.integration", () => {
  it("marks the sale failed when billing document creation fails before posting starts", async () => {
    const { useCase, spies } = createCheckoutHarness({
      saveBillingDocumentExecute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "VALIDATION_ERROR" as const,
          message: "Billing save failed.",
        },
      })),
    });

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(true);
    expect(spies.postBusinessTransactionExecute).not.toHaveBeenCalled();
    expect(spies.commitInventoryExecute).not.toHaveBeenCalled();

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Failed);
      expect(result.value.billingDocumentRemoteId).toBeNull();
      expect(result.value.ledgerEntryRemoteId).toBeNull();
      expect(result.value.postedTransactionRemoteIds).toHaveLength(0);
      expect(result.value.receipt?.ledgerEffect.type).toBe("posting_sync_failed");
    }
  });

  it("rolls back billing state when payment transaction posting fails", async () => {
    const { useCase, spies } = createCheckoutHarness({
      postBusinessTransactionExecute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "UNKNOWN_ERROR" as const,
          message: "Money posting failed.",
        },
      })),
    });

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(true);
    expect(spies.saveBillingDocumentExecute).toHaveBeenCalledTimes(1);
    expect(spies.deleteBillingDocumentExecute).toHaveBeenCalledTimes(1);
    expect(spies.commitInventoryExecute).not.toHaveBeenCalled();

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Failed);
      expect(result.value.billingDocumentRemoteId).toBeNull();
      expect(result.value.ledgerEntryRemoteId).toBeNull();
      expect(result.value.postedTransactionRemoteIds).toHaveLength(0);
    }
  });

  it("rolls back billing and payment artifacts when due-ledger creation fails", async () => {
    const { useCase, spies } = createCheckoutHarness({
      addLedgerEntryExecute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "VALIDATION_ERROR" as const,
          message: "Ledger create failed.",
        },
      })),
    });

    const result = await useCase.execute(
      createRunParams({
        paymentParts: [
          {
            paymentPartId: "part-1",
            payerLabel: null,
            amount: 400,
            settlementAccountRemoteId: "money-cash-1",
          },
        ],
        selectedCustomer: CUSTOMER,
        grandTotalSnapshot: 1000,
        totalsSnapshot: PARTIAL_TOTALS,
        cartLinesSnapshot: PARTIAL_CART_LINES,
      }),
    );

    expect(result.success).toBe(true);
    expect(spies.postBusinessTransactionExecute).toHaveBeenCalledTimes(1);
    expect(spies.addLedgerEntryExecute).toHaveBeenCalledTimes(1);
    expect(spies.deleteBusinessTransactionExecute).toHaveBeenCalledTimes(1);
    expect(spies.deleteBillingDocumentExecute).toHaveBeenCalledTimes(1);
    expect(spies.commitInventoryExecute).not.toHaveBeenCalled();

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Failed);
      expect(result.value.billingDocumentRemoteId).toBeNull();
      expect(result.value.ledgerEntryRemoteId).toBeNull();
      expect(result.value.postedTransactionRemoteIds).toHaveLength(0);
      expect(result.value.receipt?.ledgerEffect.type).toBe(
        "due_balance_create_failed",
      );
    }
  });

  it("rolls back billing, transaction, and ledger artifacts when inventory commit fails late", async () => {
    const { useCase, spies } = createCheckoutHarness({
      commitInventoryExecute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "OUT_OF_STOCK" as const,
          message: "Inventory movement would reduce Rice below zero",
        },
      })),
    });

    const result = await useCase.execute(
      createRunParams({
        paymentParts: [
          {
            paymentPartId: "part-1",
            payerLabel: null,
            amount: 400,
            settlementAccountRemoteId: "money-cash-1",
          },
        ],
        selectedCustomer: CUSTOMER,
        grandTotalSnapshot: 1000,
        totalsSnapshot: PARTIAL_TOTALS,
        cartLinesSnapshot: PARTIAL_CART_LINES,
      }),
    );

    expect(result.success).toBe(true);
    expect(spies.postBusinessTransactionExecute).toHaveBeenCalledTimes(1);
    expect(spies.addLedgerEntryExecute).toHaveBeenCalledTimes(1);
    expect(spies.commitInventoryExecute).toHaveBeenCalledTimes(1);
    expect(spies.deleteLedgerEntryExecute).toHaveBeenCalledTimes(1);
    expect(spies.deleteBillingDocumentExecute).toHaveBeenCalledTimes(1);
    expect(spies.deleteBusinessTransactionExecute).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Failed);
      expect(result.value.billingDocumentRemoteId).toBeNull();
      expect(result.value.ledgerEntryRemoteId).toBeNull();
      expect(result.value.postedTransactionRemoteIds).toHaveLength(0);
      expect(result.value.receipt?.ledgerEffect.type).toBe("posting_sync_failed");
    }
  });
});
