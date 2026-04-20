import {
  MoneyAccount,
  MoneyAccountType,
} from "@/feature/accounts/types/moneyAccount.types";
import {
  BillingDocumentStatus,
  BillingDocumentType,
  BillingTemplateType,
  SaveBillingDocumentPayload,
} from "@/feature/billing/types/billing.types";
import { Contact } from "@/feature/contacts/types/contact.types";
import {
  LedgerBalanceDirection,
  LedgerEntryType,
  LedgerPaymentMode,
  LedgerPaymentModeValue,
  SaveLedgerEntryPayload,
} from "@/feature/ledger/types/ledger.entity.types";
import { Order, OrderLine, OrderStatus } from "@/feature/orders/types/order.types";
import { resolvePersistedOrderTotalAmount } from "@/feature/orders/utils/orderSettlementFromTransactions.util";
import { TransactionSourceModule } from "@/feature/transactions/types/transaction.entity.types";

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const safeTrim = (value: string | null | undefined): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeDocumentToken = (value: string): string =>
  value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "-");

const hasValidMoneyValue = (
  value: number | null | undefined,
): value is number => Number.isFinite(value);

const resolveLineQuantity = (line: OrderLine): number =>
  Number.isFinite(line.quantity) ? line.quantity : 0;

const resolveLineUnitRate = (line: OrderLine): number => {
  if (hasValidMoneyValue(line.unitPriceSnapshot) && line.unitPriceSnapshot >= 0) {
    return roundMoney(line.unitPriceSnapshot);
  }

  const quantity = resolveLineQuantity(line);
  if (
    quantity > 0 &&
    hasValidMoneyValue(line.lineSubtotalAmount) &&
    line.lineSubtotalAmount >= 0
  ) {
    return roundMoney(line.lineSubtotalAmount / quantity);
  }

  if (
    quantity > 0 &&
    hasValidMoneyValue(line.lineTotalAmount) &&
    line.lineTotalAmount >= 0
  ) {
    return roundMoney(line.lineTotalAmount / quantity);
  }

  return 0;
};

export const isOrderFinancialStatus = (status: Order["status"]): boolean =>
  status === OrderStatus.Confirmed ||
  status === OrderStatus.Processing ||
  status === OrderStatus.Ready ||
  status === OrderStatus.Shipped ||
  status === OrderStatus.Delivered;

export const buildOrderBillingDocumentRemoteId = (orderRemoteId: string): string =>
  `bill-order-${safeTrim(orderRemoteId)}`;

export const buildOrderLedgerDueEntryRemoteId = (orderRemoteId: string): string =>
  `led-order-due-${safeTrim(orderRemoteId)}`;

export const buildOrderPaymentSettlementLedgerEntryRemoteId = (params: {
  orderRemoteId: string;
  transactionRemoteId: string;
}): string =>
  `led-order-settle-${safeTrim(params.orderRemoteId)}-${safeTrim(
    params.transactionRemoteId,
  )}`;

export const buildOrderBillingDocumentNumber = (orderNumber: string): string => {
  const normalizedOrderNumber = normalizeDocumentToken(orderNumber);
  return `ORDINV-${normalizedOrderNumber || "UNKNOWN"}`;
};

export const buildOrderRefundBillingDocumentRemoteId = (params: {
  orderRemoteId: string;
  refundLedgerEntryRemoteId: string;
}): string =>
  `bill-order-refund-${safeTrim(params.orderRemoteId)}-${safeTrim(
    params.refundLedgerEntryRemoteId,
  )}`;

export const buildOrderRefundBillingDocumentNumber = (params: {
  orderNumber: string;
  refundLedgerEntryRemoteId: string;
}): string => {
  const normalizedOrderNumber = normalizeDocumentToken(params.orderNumber);
  const refundToken =
    normalizeDocumentToken(params.refundLedgerEntryRemoteId).slice(-6) ||
    "REFUND";

  return `CRN-${normalizedOrderNumber || "UNKNOWN"}-${refundToken}`;
};

export const buildOrderRefundBillingDocumentPayload = (params: {
  order: Order;
  contact: Contact;
  refundBillingDocumentRemoteId: string;
  refundLedgerEntryRemoteId: string;
  amount: number;
  happenedAt: number;
  note: string | null;
}): SaveBillingDocumentPayload => ({
  remoteId: params.refundBillingDocumentRemoteId,
  accountRemoteId: params.order.accountRemoteId,
  documentNumber: buildOrderRefundBillingDocumentNumber({
    orderNumber: params.order.orderNumber,
    refundLedgerEntryRemoteId: params.refundLedgerEntryRemoteId,
  }),
  documentType: BillingDocumentType.CreditNote,
  templateType: BillingTemplateType.StandardInvoice,
  customerName: params.contact.fullName,
  contactRemoteId: params.contact.remoteId,
  status: BillingDocumentStatus.Paid,
  taxRatePercent: 0,
  notes: params.note,
  issuedAt: params.happenedAt,
  dueAt: null,
  sourceModule: TransactionSourceModule.Orders,
  sourceRemoteId: params.order.remoteId,
  linkedLedgerEntryRemoteId: params.refundLedgerEntryRemoteId,
  items: [
    {
      remoteId: `${params.refundBillingDocumentRemoteId}-line-1`,
      itemName: `Refund for ${safeTrim(params.order.orderNumber) || "Order"}`,
      quantity: 1,
      unitRate: roundMoney(params.amount),
      lineOrder: 0,
    },
  ],
});

export const deriveLedgerPaymentModeFromMoneyAccount = (
  moneyAccount: MoneyAccount,
): LedgerPaymentModeValue => {
  if (moneyAccount.type === MoneyAccountType.Cash) {
    return LedgerPaymentMode.Cash;
  }

  if (moneyAccount.type === MoneyAccountType.Wallet) {
    return LedgerPaymentMode.MobileWallet;
  }

  return LedgerPaymentMode.BankTransfer;
};

export const buildBillingDocumentPayloadFromOrder = (params: {
  order: Order;
  contact: Contact;
  billingDocumentRemoteId: string;
  linkedLedgerEntryRemoteId: string;
}): SaveBillingDocumentPayload => {
  const { order, contact, billingDocumentRemoteId, linkedLedgerEntryRemoteId } =
    params;
  const orderItems = Array.isArray(order.items) ? order.items : [];

  return {
    remoteId: billingDocumentRemoteId,
    accountRemoteId: order.accountRemoteId,
    documentNumber: buildOrderBillingDocumentNumber(order.orderNumber),
    documentType: BillingDocumentType.Invoice,
    templateType: BillingTemplateType.StandardInvoice,
    customerName: contact.fullName,
    contactRemoteId: contact.remoteId,
    status: BillingDocumentStatus.Pending,
    taxRatePercent:
      hasValidMoneyValue(order.taxRatePercent) && order.taxRatePercent >= 0
        ? order.taxRatePercent
        : 0,
    notes: order.notes ?? null,
    issuedAt: order.orderDate,
    dueAt: order.orderDate,
    sourceModule: TransactionSourceModule.Orders,
    sourceRemoteId: order.remoteId,
    linkedLedgerEntryRemoteId,
    items: orderItems.map((item, index) => {
      const stableLineToken = safeTrim(item.remoteId) || String(index + 1);
      return {
        remoteId: `${billingDocumentRemoteId}-line-${stableLineToken}`,
        itemName: safeTrim(item.productNameSnapshot) || "Order Item",
        quantity: resolveLineQuantity(item),
        unitRate: resolveLineUnitRate(item),
        lineOrder: index,
      };
    }),
  };
};

export const buildLedgerDuePayloadFromOrder = (params: {
  order: Order;
  contact: Contact;
  billingDocumentRemoteId: string;
  ledgerDueEntryRemoteId: string;
}): SaveLedgerEntryPayload => {
  const { order, contact, billingDocumentRemoteId, ledgerDueEntryRemoteId } = params;
  const resolvedTotalAmount = resolvePersistedOrderTotalAmount(order) ?? 0;

  return {
    remoteId: ledgerDueEntryRemoteId,
    businessAccountRemoteId: order.accountRemoteId,
    ownerUserRemoteId: order.ownerUserRemoteId,
    partyName: contact.fullName,
    partyPhone: contact.phoneNumber ?? null,
    contactRemoteId: contact.remoteId,
    entryType: LedgerEntryType.Sale,
    balanceDirection: LedgerBalanceDirection.Receive,
    title: `Order ${safeTrim(order.orderNumber) || order.remoteId}`,
    amount: resolvedTotalAmount,
    currencyCode: null,
    note: order.notes ?? null,
    happenedAt: order.orderDate,
    dueAt: order.orderDate,
    paymentMode: null,
    referenceNumber: safeTrim(order.orderNumber) || null,
    reminderAt: null,
    attachmentUri: null,
    settledAgainstEntryRemoteId: null,
    linkedDocumentRemoteId: billingDocumentRemoteId,
    linkedTransactionRemoteId: null,
    settlementAccountRemoteId: null,
    settlementAccountDisplayNameSnapshot: null,
  };
};

export const buildOrderPaymentSettlementLedgerPayload = (params: {
  order: Order;
  contact: Contact;
  billingDocumentRemoteId: string;
  ledgerDueEntryRemoteId: string;
  settlementLedgerEntryRemoteId: string;
  linkedTransactionRemoteId: string;
  settlementMoneyAccount: MoneyAccount;
  settlementMoneyAccountDisplayNameSnapshot: string;
  amount: number;
  happenedAt: number;
  note: string | null;
  currencyCode: string | null;
}): SaveLedgerEntryPayload => {
  const {
    order,
    contact,
    billingDocumentRemoteId,
    ledgerDueEntryRemoteId,
    settlementLedgerEntryRemoteId,
    linkedTransactionRemoteId,
    settlementMoneyAccount,
    settlementMoneyAccountDisplayNameSnapshot,
    amount,
    happenedAt,
    note,
    currencyCode,
  } = params;

  return {
    remoteId: settlementLedgerEntryRemoteId,
    businessAccountRemoteId: order.accountRemoteId,
    ownerUserRemoteId: order.ownerUserRemoteId,
    partyName: contact.fullName,
    partyPhone: contact.phoneNumber ?? null,
    contactRemoteId: contact.remoteId,
    entryType: LedgerEntryType.Collection,
    balanceDirection: LedgerBalanceDirection.Receive,
    title: `Order Payment ${safeTrim(order.orderNumber) || order.remoteId}`,
    amount,
    currencyCode,
    note,
    happenedAt,
    dueAt: null,
    paymentMode: deriveLedgerPaymentModeFromMoneyAccount(settlementMoneyAccount),
    referenceNumber: safeTrim(order.orderNumber) || null,
    reminderAt: null,
    attachmentUri: null,
    settledAgainstEntryRemoteId: ledgerDueEntryRemoteId,
    linkedDocumentRemoteId: billingDocumentRemoteId,
    linkedTransactionRemoteId,
    settlementAccountRemoteId: settlementMoneyAccount.remoteId,
    settlementAccountDisplayNameSnapshot:
      settlementMoneyAccountDisplayNameSnapshot,
  };
};
