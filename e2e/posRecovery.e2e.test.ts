import { BillingErrorType } from "@/feature/billing/types/billing.types";
import { LedgerErrorType } from "@/feature/ledger/types/ledger.error.types";
import { PosArtifactReconciliationStatus } from "@/feature/pos/types/posSaleHistory.entity.types";
import { PosCheckoutWorkflowStatus } from "@/feature/pos/workflow/posCheckout/types/posCheckout.state.types";
import { TransactionPostingStatus } from "@/feature/transactions/types/transaction.entity.types";
import { describe, expect, it, vi } from "vitest";
import {
  buildE2eCustomer,
  createBusinessFlowE2eHarness,
} from "@/tests/helpers/businessFlowE2e.helper";

const createPartiallyPostedSale = async () => {
  const harness = createBusinessFlowE2eHarness();

  await harness.seedBusinessContext();
  const moneyAccount = await harness.createMoneyAccount();
  await harness.createProductWithOpeningStock();
  await harness.openPos(moneyAccount.remoteId);
  await harness.addProductToCart("product-1");

  const { cartLines, totals } = await harness.getCartSnapshot();
  const failingCheckoutUseCase = harness.useCases.buildRunPosCheckoutUseCase({
    commitPosCheckoutInventoryUseCase: {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "OUT_OF_STOCK" as const,
          message: "Simulated late inventory failure.",
        },
      })),
    } as never,
    deleteBillingDocumentUseCase: {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: BillingErrorType.UnknownError,
          message: "Simulated billing rollback failure.",
        },
      })),
    } as never,
    deleteLedgerEntryUseCase: {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: LedgerErrorType.UnknownError,
          message: "Simulated ledger rollback failure.",
        },
      })),
    } as never,
    deleteBusinessTransactionUseCase: {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "UNKNOWN_ERROR" as const,
          message: "Simulated transaction rollback failure.",
        },
      })),
    } as never,
  });

  const checkoutResult = await harness.checkout({
    idempotencyKey: "pos-recovery-1",
    paymentParts: [
      {
        paymentPartId: "part-1",
        payerLabel: null,
        amount: 400,
        settlementAccountRemoteId: moneyAccount.remoteId,
      },
    ],
    selectedCustomer: buildE2eCustomer(),
    cartLinesSnapshot: cartLines,
    totalsSnapshot: totals,
    grandTotalSnapshot: totals.grandTotal,
    checkoutUseCase: failingCheckoutUseCase,
  });

  expect(checkoutResult.success).toBe(true);
  if (!checkoutResult.success) {
    throw new Error("Expected partially-posted checkout result.");
  }

  expect(checkoutResult.value.workflowStatus).toBe(
    PosCheckoutWorkflowStatus.PartiallyPosted,
  );

  const sale = await harness.lookupSaleByIdempotencyKey("pos-recovery-1");
  if (!sale) {
    throw new Error("Expected persisted partially-posted sale.");
  }

  return {
    harness,
    sale,
    checkoutResult: checkoutResult.value,
  };
};

describe("posRecovery.e2e", () => {
  it("reconciles a partially-posted POS sale and surfaces the unresolved linked artifacts", async () => {
    const { harness, sale } = await createPartiallyPostedSale();

    const reconciliation = await harness.useCases.reconcilePosSaleUseCase.execute({
      sale,
    });

    expect(reconciliation.success).toBe(true);
    if (!reconciliation.success) {
      return;
    }

    expect(reconciliation.value.canRunCleanup).toBe(true);
    expect(reconciliation.value.hasUnresolvedArtifacts).toBe(true);
    expect(reconciliation.value.inventoryMovements.status).toBe(
      PosArtifactReconciliationStatus.NotRecorded,
    );
    expect(reconciliation.value.billingDocument.status).toBe(
      PosArtifactReconciliationStatus.Present,
    );
    expect(reconciliation.value.ledgerEntry.status).toBe(
      PosArtifactReconciliationStatus.Present,
    );
    expect(reconciliation.value.transactionRefs.status).toBe(
      PosArtifactReconciliationStatus.RecordedOnly,
    );
  });

  it("cleans up a partially-posted POS sale and clears the recorded billing, ledger, and transaction refs", async () => {
    const { harness, sale, checkoutResult } = await createPartiallyPostedSale();

    const cleanup = await harness.useCases.resolvePosAbnormalSaleUseCase.execute({
      sale,
    });

    expect(cleanup.success).toBe(true);
    if (!cleanup.success) {
      return;
    }

    expect(cleanup.value.wasFullyCleaned).toBe(true);

    const updatedSale = await harness.lookupSaleByIdempotencyKey("pos-recovery-1");
    expect(updatedSale?.workflowStatus).toBe(PosCheckoutWorkflowStatus.Failed);
    expect(updatedSale?.billingDocumentRemoteId).toBeNull();
    expect(updatedSale?.ledgerEntryRemoteId).toBeNull();
    expect(updatedSale?.postedTransactionRemoteIds).toEqual([]);

    const billingLookup = await harness.lookupBillingDocument(
      checkoutResult.billingDocumentRemoteId as string,
    );
    expect(billingLookup.success).toBe(false);
    if (!billingLookup.success) {
      expect(billingLookup.error.type).toBe(BillingErrorType.DocumentNotFound);
    }

    const ledgerLookup = await harness.lookupLedgerEntry(
      checkoutResult.ledgerEntryRemoteId as string,
    );
    expect(ledgerLookup.success).toBe(false);
    if (!ledgerLookup.success) {
      expect(ledgerLookup.error.type).toBe(LedgerErrorType.LedgerEntryNotFound);
    }

    const transactionLookup = await harness.lookupTransaction(
      checkoutResult.postedTransactionRemoteIds[0],
    );
    expect(transactionLookup.success).toBe(true);
    if (transactionLookup.success) {
      expect(transactionLookup.value.postingStatus).toBe(
        TransactionPostingStatus.Voided,
      );
    }

    const postedTransactions = await harness.getPostedTransactions();
    expect(postedTransactions).toHaveLength(0);

    expect(harness.getAuditEventCount()).toBe(4);
  });
});
