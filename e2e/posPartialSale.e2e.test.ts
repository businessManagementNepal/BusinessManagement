import { PosCheckoutWorkflowStatus } from "@/feature/pos/workflow/posCheckout/types/posCheckout.state.types";
import { describe, expect, it } from "vitest";
import {
  buildE2eCustomer,
  createBusinessFlowE2eHarness,
} from "@/tests/helpers/businessFlowE2e.helper";

describe("posPartialSale.e2e", () => {
  it("posts a partially paid sale and leaves a due ledger entry for the remaining balance", async () => {
    const harness = createBusinessFlowE2eHarness();

    await harness.seedBusinessContext();
    const moneyAccount = await harness.createMoneyAccount();
    await harness.createProductWithOpeningStock();
    await harness.openPos(moneyAccount.remoteId);
    await harness.addProductToCart("product-1");

    const customer = buildE2eCustomer();
    const { cartLines, totals } = await harness.getCartSnapshot();
    const result = await harness.checkout({
      idempotencyKey: "pos-partial-sale-1",
      paymentParts: [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: 400,
          settlementAccountRemoteId: moneyAccount.remoteId,
        },
      ],
      selectedCustomer: customer,
      cartLinesSnapshot: cartLines,
      totalsSnapshot: totals,
      grandTotalSnapshot: totals.grandTotal,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.workflowStatus).toBe(PosCheckoutWorkflowStatus.Posted);
    expect(result.value.billingDocumentRemoteId).toBeTruthy();
    expect(result.value.ledgerEntryRemoteId).toBeTruthy();
    expect(result.value.postedTransactionRemoteIds).toHaveLength(1);
    expect(result.value.receipt?.dueAmount).toBe(600);
    expect(result.value.receipt?.ledgerEffect.type).toBe("due_balance_created");

    const moneyAccounts = await harness.getMoneyAccounts();
    expect(moneyAccounts[0]?.currentBalance).toBe(400);

    const ledgerEntries = await harness.getLedgerEntries();
    expect(ledgerEntries).toHaveLength(1);
    expect(ledgerEntries[0]).toEqual(
      expect.objectContaining({
        amount: 600,
        contactRemoteId: customer.remoteId,
        linkedDocumentRemoteId: result.value.billingDocumentRemoteId,
      }),
    );

    const billingDocument = await harness.lookupBillingDocument(
      result.value.billingDocumentRemoteId as string,
    );
    expect(billingDocument.success).toBe(true);
    if (billingDocument.success) {
      expect(billingDocument.value.customerName).toBe(customer.fullName);
      expect(billingDocument.value.linkedLedgerEntryRemoteId).toBe(
        result.value.ledgerEntryRemoteId,
      );
    }

    const inventorySnapshot = await harness.getInventorySnapshot();
    expect(inventorySnapshot.stockItems[0]?.stockQuantity).toBe(9);

    expect(harness.getAuditEventCount()).toBe(2);
  });
});
