import { ProductKind } from "@/feature/products/types/product.types";
import { PosCheckoutWorkflowStatus } from "@/feature/pos/workflow/posCheckout/types/posCheckout.state.types";
import { buildPosCartLine, buildPosTotals } from "@/tests/helpers/posTestBuilders";
import {
  BASE_TOTALS,
  CUSTOMER,
  buildReceiptSnapshot,
  createCheckoutHarness,
  createRunParams,
  createSaleRecord,
} from "@/tests/helpers/posCheckoutIntegration.helper";
import { describe, expect, it } from "vitest";

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

describe("posCheckout.integration", () => {
  it("creates a fully paid POS sale with billing, transaction, and inventory effects", async () => {
    const { useCase, spies } = createCheckoutHarness();

    const result = await useCase.execute(createRunParams());

    expect(result.success).toBe(true);
    expect(spies.createPosSaleDraftExecute).toHaveBeenCalledTimes(1);
    expect(spies.saveBillingDocumentExecute).toHaveBeenCalledTimes(1);
    expect(spies.postBusinessTransactionExecute).toHaveBeenCalledTimes(1);
    expect(spies.addLedgerEntryExecute).not.toHaveBeenCalled();
    expect(spies.commitInventoryExecute).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
      expect(result.value.billingDocumentRemoteId).toBeTruthy();
      expect(result.value.ledgerEntryRemoteId).toBeNull();
      expect(result.value.postedTransactionRemoteIds).toHaveLength(1);
      expect(result.value.receipt?.ledgerEffect.type).toBe("none");
      expect(result.value.receipt?.dueAmount).toBe(0);
    }
  });

  it("creates an unpaid POS sale with due ledger linkage and no money transaction", async () => {
    const { useCase, spies } = createCheckoutHarness();

    const result = await useCase.execute(
      createRunParams({
        paymentParts: [],
        selectedCustomer: CUSTOMER,
      }),
    );

    expect(result.success).toBe(true);
    expect(spies.saveBillingDocumentExecute).toHaveBeenCalledTimes(1);
    expect(spies.postBusinessTransactionExecute).not.toHaveBeenCalled();
    expect(spies.addLedgerEntryExecute).toHaveBeenCalledTimes(1);
    expect(spies.commitInventoryExecute).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
      expect(result.value.billingDocumentRemoteId).toBeTruthy();
      expect(result.value.ledgerEntryRemoteId).toBeTruthy();
      expect(result.value.postedTransactionRemoteIds).toHaveLength(0);
      expect(result.value.receipt?.ledgerEffect.type).toBe("due_balance_created");
      expect(result.value.receipt?.contactRemoteId).toBe(CUSTOMER.remoteId);
      expect(result.value.receipt?.dueAmount).toBe(BASE_TOTALS.grandTotal);
    }
  });

  it("creates a partial POS sale with one payment transaction and one due ledger entry", async () => {
    const { useCase, spies } = createCheckoutHarness();

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
    expect(spies.saveBillingDocumentExecute).toHaveBeenCalledTimes(1);
    expect(spies.postBusinessTransactionExecute).toHaveBeenCalledTimes(1);
    expect(spies.addLedgerEntryExecute).toHaveBeenCalledTimes(1);
    expect(spies.commitInventoryExecute).toHaveBeenCalledTimes(1);
    expect(spies.postBusinessTransactionExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 400,
      }),
    );
    expect(spies.addLedgerEntryExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 600,
      }),
    );

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
      expect(result.value.postedTransactionRemoteIds).toHaveLength(1);
      expect(result.value.ledgerEntryRemoteId).toBeTruthy();
      expect(result.value.receipt?.dueAmount).toBe(600);
      expect(result.value.receipt?.ledgerEffect.type).toBe("due_balance_created");
    }
  });

  it("keeps checkout idempotent when the same checkout request is submitted twice", async () => {
    const harness = createCheckoutHarness();

    const first = await harness.useCase.execute(createRunParams());
    const second = await harness.useCase.execute(createRunParams());

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(harness.spies.createPosSaleDraftExecute).toHaveBeenCalledTimes(1);
    expect(harness.spies.saveBillingDocumentExecute).toHaveBeenCalledTimes(1);
    expect(harness.spies.postBusinessTransactionExecute).toHaveBeenCalledTimes(1);
    expect(harness.spies.commitInventoryExecute).toHaveBeenCalledTimes(1);

    if (second.success) {
      expect(second.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
      expect(second.value.postedTransactionRemoteIds).toHaveLength(1);
    }
  });

  it("retries a partially completed checkout from persisted sale state without duplicating effects", async () => {
    const initialSale = createSaleRecord({
      workflowStatus: PosCheckoutWorkflowStatus.PendingPosting,
      customerRemoteId: CUSTOMER.remoteId,
      customerNameSnapshot: CUSTOMER.fullName,
      customerPhoneSnapshot: CUSTOMER.phone,
      totalsSnapshot: PARTIAL_TOTALS,
      cartLinesSnapshot: PARTIAL_CART_LINES,
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: 400,
          settlementAccountRemoteId: "money-cash-1",
        },
      ],
      receipt: buildReceiptSnapshot({
        receiptNumber: "POS-001",
        cartLines: PARTIAL_CART_LINES,
        totals: PARTIAL_TOTALS,
        paymentParts: [
          {
            paymentPartId: "part-1",
            payerLabel: null,
            amount: 400,
            settlementAccountRemoteId: "money-cash-1",
          },
        ],
        selectedCustomer: CUSTOMER,
      }),
      billingDocumentRemoteId: "pos-doc-sale-1",
      ledgerEntryRemoteId: "pos-ledger-sale-1",
      postedTransactionRemoteIds: ["txn-pos-sale-1-part-1"],
    });

    const { useCase, spies } = createCheckoutHarness({
      initialSaleState: initialSale,
    });

    const result = await useCase.execute(
      createRunParams({
        paymentParts: [],
        cartLinesSnapshot: [],
      }),
    );

    expect(result.success).toBe(true);
    expect(spies.createPosSaleDraftExecute).not.toHaveBeenCalled();
    expect(spies.postBusinessTransactionExecute).not.toHaveBeenCalled();
    expect(spies.addLedgerEntryExecute).not.toHaveBeenCalled();
    expect(spies.saveBillingDocumentExecute).toHaveBeenCalledTimes(1);
    expect(spies.commitInventoryExecute).toHaveBeenCalledTimes(1);

    if (result.success) {
      expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
      expect(result.value.billingDocumentRemoteId).toBe("pos-doc-sale-1");
      expect(result.value.ledgerEntryRemoteId).toBe("pos-ledger-sale-1");
      expect(result.value.postedTransactionRemoteIds).toEqual([
        "txn-pos-sale-1-part-1",
      ]);
    }
  });
});
