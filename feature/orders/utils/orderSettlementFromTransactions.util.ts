import { Order, OrderLine } from "@/feature/orders/types/order.types";
import {
  Transaction,
  TransactionPostingStatus,
  TransactionSourceModule,
} from "@/feature/transactions/types/transaction.entity.types";

export const ORDER_TRANSACTION_SOURCE_ACTION = {
  Payment: "payment",
  Refund: "refund",
} as const;

type OrderTransactionSourceActionValue =
  (typeof ORDER_TRANSACTION_SOURCE_ACTION)[keyof typeof ORDER_TRANSACTION_SOURCE_ACTION];

type OrderSettlementSnapshot = {
  grossPaidAmount: number;
  grossRefundedAmount: number;
  netPaidAmount: number;
  balanceDueAmount: number | null;
};

const MONEY_EPSILON = 0.0001;

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const safeTrim = (value: string | null | undefined): string =>
  typeof value === "string" ? value.trim() : "";

const hasValidMoneyValue = (
  value: number | null | undefined,
): value is number => Number.isFinite(value);

const isPostedTransaction = (transaction: Transaction): boolean =>
  transaction.postingStatus === TransactionPostingStatus.Posted;

const sumTransactionAmounts = (transactions: readonly Transaction[]): number =>
  roundMoney(
    transactions.reduce((sum, transaction) => sum + transaction.amount, 0),
  );

const getStableLinkedTransactions = (params: {
  transactions: readonly Transaction[];
  orderRemoteId: string;
  sourceAction: OrderTransactionSourceActionValue;
}): Transaction[] =>
  params.transactions.filter(
    (transaction) =>
      isPostedTransaction(transaction) &&
      transaction.sourceModule === TransactionSourceModule.Orders &&
      safeTrim(transaction.sourceRemoteId) === params.orderRemoteId &&
      safeTrim(transaction.sourceAction) === params.sourceAction,
  );

const resolveOrderLineTotalAmount = (line: OrderLine): number | null => {
  if (hasValidMoneyValue(line.lineTotalAmount)) {
    return line.lineTotalAmount;
  }

  if (
    hasValidMoneyValue(line.lineSubtotalAmount) &&
    hasValidMoneyValue(line.lineTaxAmount)
  ) {
    return roundMoney(line.lineSubtotalAmount + line.lineTaxAmount);
  }

  if (
    hasValidMoneyValue(line.unitPriceSnapshot) &&
    hasValidMoneyValue(line.taxRatePercentSnapshot) &&
    Number.isFinite(line.quantity)
  ) {
    const lineSubtotalAmount = roundMoney(line.quantity * line.unitPriceSnapshot);
    const lineTaxAmount = roundMoney(
      (lineSubtotalAmount * line.taxRatePercentSnapshot) / 100,
    );

    return roundMoney(lineSubtotalAmount + lineTaxAmount);
  }

  return null;
};

export const resolvePersistedOrderTotalAmount = (order: Order): number | null => {
  if (hasValidMoneyValue(order.totalAmount)) {
    return order.totalAmount;
  }

  const orderItems = Array.isArray(order.items) ? order.items : [];
  if (orderItems.length === 0) {
    return null;
  }

  const resolvedLineTotals = orderItems.map(resolveOrderLineTotalAmount);
  if (resolvedLineTotals.some((lineTotalAmount) => lineTotalAmount === null)) {
    return null;
  }

  const nonNullLineTotals = resolvedLineTotals.filter(
    (lineTotalAmount): lineTotalAmount is number => lineTotalAmount !== null,
  );

  return roundMoney(
    nonNullLineTotals.reduce((sum, lineTotalAmount) => sum + lineTotalAmount, 0),
  );
};

export const getOrderNetPaidAmountFromTransactions = (params: {
  orderRemoteId: string;
  transactions: readonly Transaction[];
}): number => {
  const paymentTransactions = getStableLinkedTransactions({
    transactions: params.transactions,
    orderRemoteId: params.orderRemoteId.trim(),
    sourceAction: ORDER_TRANSACTION_SOURCE_ACTION.Payment,
  });

  const refundTransactions = getStableLinkedTransactions({
    transactions: params.transactions,
    orderRemoteId: params.orderRemoteId.trim(),
    sourceAction: ORDER_TRANSACTION_SOURCE_ACTION.Refund,
  });

  const netPaidAmount = roundMoney(
    sumTransactionAmounts(paymentTransactions) -
      sumTransactionAmounts(refundTransactions),
  );

  return netPaidAmount > MONEY_EPSILON ? netPaidAmount : 0;
};

export const calculateOrderSettlementSnapshot = (params: {
  order: Order;
  transactions: readonly Transaction[];
}): OrderSettlementSnapshot => {
  const grossPaidAmount = sumTransactionAmounts(
    getStableLinkedTransactions({
      transactions: params.transactions,
      orderRemoteId: params.order.remoteId.trim(),
      sourceAction: ORDER_TRANSACTION_SOURCE_ACTION.Payment,
    }),
  );

  const grossRefundedAmount = sumTransactionAmounts(
    getStableLinkedTransactions({
      transactions: params.transactions,
      orderRemoteId: params.order.remoteId.trim(),
      sourceAction: ORDER_TRANSACTION_SOURCE_ACTION.Refund,
    }),
  );

  const netPaidAmount = roundMoney(grossPaidAmount - grossRefundedAmount);
  const clampedNetPaidAmount = netPaidAmount > MONEY_EPSILON ? netPaidAmount : 0;

  const resolvedOrderTotalAmount = resolvePersistedOrderTotalAmount(params.order);

  return {
    grossPaidAmount,
    grossRefundedAmount,
    netPaidAmount: clampedNetPaidAmount,
    balanceDueAmount:
      resolvedOrderTotalAmount === null
        ? null
        : roundMoney(
            Math.max(resolvedOrderTotalAmount - clampedNetPaidAmount, 0),
          ),
  };
};
