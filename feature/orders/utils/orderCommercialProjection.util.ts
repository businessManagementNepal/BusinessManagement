import { BillingDocument } from "@/feature/billing/types/billing.types";
import {
  LedgerEntry,
  LedgerEntryType,
} from "@/feature/ledger/types/ledger.entity.types";
import { Order } from "@/feature/orders/types/order.types";
import {
  buildOrderBillingDocumentRemoteId,
  buildOrderLedgerDueEntryRemoteId,
} from "@/feature/orders/utils/orderCommercialEffects.util";
import {
  getOrderNetPaidAmountFromTransactions,
  resolvePersistedOrderTotalAmount,
} from "@/feature/orders/utils/orderSettlementFromTransactions.util";
import {
  Transaction,
  TransactionSourceModule,
} from "@/feature/transactions/types/transaction.entity.types";

export type OrderCommercialSettlementSnapshot = {
  billingDocument: BillingDocument | null;
  dueEntry: LedgerEntry | null;
  paidAmount: number;
  refundedAmount: number;
  balanceDueAmount: number;
};

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const safeTrim = (value: string | null | undefined): string =>
  typeof value === "string" ? value.trim() : "";

export const findBillingDocumentForOrder = (params: {
  orderRemoteId: string;
  billingDocuments: readonly BillingDocument[];
}): BillingDocument | null => {
  const normalizedOrderRemoteId = safeTrim(params.orderRemoteId);
  if (!normalizedOrderRemoteId) {
    return null;
  }

  const deterministicBillingDocumentRemoteId =
    buildOrderBillingDocumentRemoteId(normalizedOrderRemoteId);

  return (
    params.billingDocuments.find(
      (document) =>
        document.remoteId === deterministicBillingDocumentRemoteId ||
        (document.sourceModule === TransactionSourceModule.Orders &&
          safeTrim(document.sourceRemoteId) === normalizedOrderRemoteId),
    ) ?? null
  );
};

export const findLedgerDueEntryForOrder = (params: {
  orderRemoteId: string;
  ledgerEntries: readonly LedgerEntry[];
}): LedgerEntry | null => {
  const normalizedOrderRemoteId = safeTrim(params.orderRemoteId);
  if (!normalizedOrderRemoteId) {
    return null;
  }

  const deterministicDueEntryRemoteId =
    buildOrderLedgerDueEntryRemoteId(normalizedOrderRemoteId);

  return (
    params.ledgerEntries.find(
      (entry) => entry.remoteId === deterministicDueEntryRemoteId,
    ) ?? null
  );
};

const getSettlementEntriesForDue = (params: {
  dueEntryRemoteId: string;
  ledgerEntries: readonly LedgerEntry[];
}): readonly LedgerEntry[] =>
  params.ledgerEntries.filter(
    (entry) =>
      safeTrim(entry.settledAgainstEntryRemoteId) ===
      safeTrim(params.dueEntryRemoteId),
  );

const calculateCollectedAmountFromLedgerSettlements = (params: {
  dueEntryRemoteId: string;
  ledgerEntries: readonly LedgerEntry[];
}): number =>
  roundMoney(
    getSettlementEntriesForDue(params)
      .filter((entry) => entry.entryType === LedgerEntryType.Collection)
      .reduce((sum, entry) => sum + entry.amount, 0),
  );

export const calculateRefundedAmountFromLedgerSettlements = (params: {
  dueEntryRemoteId: string;
  ledgerEntries: readonly LedgerEntry[];
}): number =>
  roundMoney(
    getSettlementEntriesForDue(params)
      .filter(
        (entry) =>
          entry.entryType === LedgerEntryType.PaymentOut ||
          entry.entryType === LedgerEntryType.Refund,
      )
      .reduce((sum, entry) => sum + entry.amount, 0),
  );

export const calculateOrderCommercialSettlementSnapshot = (params: {
  order: Order;
  billingDocuments: readonly BillingDocument[];
  ledgerEntries: readonly LedgerEntry[];
  transactions: readonly Transaction[];
}): OrderCommercialSettlementSnapshot => {
  const billingDocument = findBillingDocumentForOrder({
    orderRemoteId: params.order.remoteId,
    billingDocuments: params.billingDocuments,
  });

  const dueEntry = findLedgerDueEntryForOrder({
    orderRemoteId: params.order.remoteId,
    ledgerEntries: params.ledgerEntries,
  });

  const legacyNetPaidAmount = getOrderNetPaidAmountFromTransactions({
    orderRemoteId: params.order.remoteId,
    transactions: params.transactions,
  });

  const collectedAmountFromLedger = dueEntry
    ? calculateCollectedAmountFromLedgerSettlements({
        dueEntryRemoteId: dueEntry.remoteId,
        ledgerEntries: params.ledgerEntries,
      })
    : 0;

  const refundedAmountFromLedger = dueEntry
    ? calculateRefundedAmountFromLedgerSettlements({
        dueEntryRemoteId: dueEntry.remoteId,
        ledgerEntries: params.ledgerEntries,
      })
    : 0;

  const grossPaidAmount =
    collectedAmountFromLedger > 0
      ? collectedAmountFromLedger
      : billingDocument
        ? roundMoney(billingDocument.paidAmount)
        : legacyNetPaidAmount > 0
          ? roundMoney(legacyNetPaidAmount)
          : 0;

  const refundedAmount =
    refundedAmountFromLedger > 0
      ? refundedAmountFromLedger
      : billingDocument
        ? roundMoney(
            Math.max(billingDocument.paidAmount - legacyNetPaidAmount, 0),
          )
        : 0;

  const paidAmount = roundMoney(Math.max(grossPaidAmount - refundedAmount, 0));

  const balanceDueAmount = billingDocument
    ? roundMoney(Math.max(billingDocument.outstandingAmount, 0))
    : dueEntry
      ? roundMoney(Math.max(dueEntry.amount - collectedAmountFromLedger, 0))
      : roundMoney(
          Math.max(
            (resolvePersistedOrderTotalAmount(params.order) ?? 0) - paidAmount,
            0,
          ),
        );

  return {
    billingDocument,
    dueEntry,
    paidAmount,
    refundedAmount,
    balanceDueAmount,
  };
};
