import { PosCheckoutWorkflowStatus } from "@/feature/pos/workflow/posCheckout/types/posCheckout.state.types";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_E2E_CONTEXT,
  createBusinessFlowE2eHarness,
} from "@/tests/helpers/businessFlowE2e.helper";

describe("posPaidSale.e2e", () => {
  it("opens POS, adds a stocked product, and posts a fully paid sale with money, billing, inventory, and audit effects", async () => {
    const harness = createBusinessFlowE2eHarness();

    await harness.seedBusinessContext();
    const moneyAccount = await harness.createMoneyAccount();
    await harness.createProductWithOpeningStock();
    await harness.openPos(moneyAccount.remoteId);
    await harness.addProductToCart("product-1");

    const { cartLines, totals } = await harness.getCartSnapshot();
    const result = await harness.checkout({
      idempotencyKey: "pos-paid-sale-1",
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: totals.grandTotal,
          settlementAccountRemoteId: moneyAccount.remoteId,
        },
      ],
      selectedCustomer: null,
      cartLinesSnapshot: cartLines,
      totalsSnapshot: totals,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
    expect(result.value.billingDocumentRemoteId).toBeTruthy();
    expect(result.value.ledgerEntryRemoteId).toBeNull();
    expect(result.value.postedTransactionRemoteIds).toHaveLength(1);
    expect(result.value.receipt?.dueAmount).toBe(0);
    expect(result.value.receipt?.ledgerEffect.type).toBe("none");

    const moneyAccounts = await harness.getMoneyAccounts();
    expect(moneyAccounts[0]?.currentBalance).toBe(totals.grandTotal);

    const inventorySnapshot = await harness.getInventorySnapshot();
    expect(inventorySnapshot.stockItems[0]?.stockQuantity).toBe(9);

    const billingDocument = await harness.lookupBillingDocument(
      result.value.billingDocumentRemoteId as string,
    );
    expect(billingDocument.success).toBe(true);
    if (billingDocument.success) {
      expect(billingDocument.value.customerName).toBe("Walk-in Customer");
      expect(billingDocument.value.sourceRemoteId).toBeTruthy();
    }

    const postedTransactions = await harness.getPostedTransactions();
    expect(postedTransactions).toHaveLength(1);
    expect(postedTransactions[0]).toEqual(
      expect.objectContaining({
        accountRemoteId: DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
        settlementMoneyAccountRemoteId: moneyAccount.remoteId,
        amount: totals.grandTotal,
        sourceModule: "pos",
      }),
    );

    const persistedSale = await harness.lookupSaleByIdempotencyKey(
      "pos-paid-sale-1",
    );
    expect(persistedSale?.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);

    expect(harness.getAuditEventCount()).toBe(2);
  });
});
