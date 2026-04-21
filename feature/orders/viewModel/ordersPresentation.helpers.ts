import {
    MoneyAccount,
    MoneyAccountType,
} from "@/feature/accounts/types/moneyAccount.types";
import { Contact } from "@/feature/contacts/types/contact.types";
import {
    OrderFormPricingPreview,
    OrderFormState,
    OrderLineFormState,
    OrderMoneyFormState,
} from "@/feature/orders/types/order.state.types";
import {
    Order,
    ORDER_STATUS_OPTIONS,
    OrderLine,
    OrderStatus,
} from "@/feature/orders/types/order.types";
import {
    OrderDetailItemView,
    OrderDetailPricingView,
    OrderDetailView,
    OrderListItemView,
} from "@/feature/orders/types/order.view.types";
import { OrderSettlementSnapshot } from "@/feature/orders/types/orderSettlement.dto.types";
import {
    canDeleteOrder,
    canEditOrderStructure,
    getOrderDeleteBlockedReason,
    getOrderEditBlockedReason,
    isOrderTerminalStatus,
} from "@/feature/orders/utils/orderLifecyclePolicy.util";
import { Product } from "@/feature/products/types/product.types";
import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import {
    formatCurrencyAmount,
} from "@/shared/utils/currency/accountCurrency";
import * as Crypto from "expo-crypto";

export const DEFAULT_ORDER_TAX_RATE_PERCENT = 13;
export const FALLBACK_PAYMENT_METHOD = "Cash";

export const ORDER_PAYMENT_METHOD_OPTIONS: readonly DropdownOption[] = [
  { label: "Cash", value: "Cash" },
  { label: "Bank Transfer", value: "Bank Transfer" },
  { label: "Credit", value: "Credit" },
  { label: "UPI/QR", value: "UPI/QR" },
] as const;

export const createEmptyLineItem = (): OrderLineFormState => ({
  remoteId: Crypto.randomUUID(),
  productRemoteId: "",
  quantity: "1",
});

export const EMPTY_FORM: OrderFormState = {
  remoteId: null,
  orderNumber: "",
  orderDate: new Date().toISOString().slice(0, 10),
  customerRemoteId: "",
  deliveryOrPickupDetails: "",
  notes: "",
  tags: "",
  internalRemarks: "",
  status: OrderStatus.Draft,
  items: [createEmptyLineItem()],
};

export const EMPTY_MONEY_FORM: OrderMoneyFormState = {
  visible: false,
  action: "payment",
  orderRemoteId: null,
  orderNumber: "",
  amount: "",
  happenedAt: new Date().toISOString().slice(0, 10),
  settlementMoneyAccountRemoteId: "",
  note: "",
  attemptRemoteId: null,
};

export const parseNumber = (value: string): number | null => {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
};

export const safeTrim = (value: string | null | undefined): string =>
  typeof value === "string" ? value.trim() : "";

export const hasValidMoneyValue = (
  value: number | null | undefined,
): value is number => Number.isFinite(value);

export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const normalizePaymentMethod = (
  value: string | null | undefined,
): string => {
  const normalizedValue = safeTrim(value);
  return normalizedValue.length > 0 ? normalizedValue : FALLBACK_PAYMENT_METHOD;
};

export const formatDateInput = (timestamp: number): string =>
  new Date(timestamp).toISOString().slice(0, 10);

export const formatDateLabel = (timestamp: number): string =>
  new Date(timestamp).toISOString().slice(0, 10);

export const mapOrderToForm = (order: Order): OrderFormState => {
  const orderItems = Array.isArray(order.items) ? order.items : [];

  return {
    remoteId: order.remoteId,
    orderNumber: order.orderNumber,
    orderDate: formatDateInput(order.orderDate),
    customerRemoteId: order.customerRemoteId ?? "",
    deliveryOrPickupDetails: order.deliveryOrPickupDetails ?? "",
    notes: order.notes ?? "",
    tags: normalizePaymentMethod(order.tags),
    internalRemarks: order.internalRemarks ?? "",
    status: order.status,
    items:
      orderItems.length > 0
        ? orderItems.map((item) => ({
            remoteId: item.remoteId,
            productRemoteId: item.productRemoteId,
            quantity: String(item.quantity),
          }))
        : [createEmptyLineItem()],
  };
};

export const buildNextOrderNumber = (orders: Order[]): string => {
  const maxSerial = orders.reduce((highest, order) => {
    const normalizedOrderNumber =
      typeof order.orderNumber === "string" ? order.orderNumber.trim() : "";
    const match = /(?:ORD)-?(\d+)$/i.exec(normalizedOrderNumber);
    if (!match) {
      return highest;
    }
    const parsed = Number(match[1]);
    if (!Number.isFinite(parsed)) {
      return highest;
    }
    return Math.max(highest, parsed);
  }, 0);

  return `ORD-${String(maxSerial + 1).padStart(3, "0")}`;
};

export const mapMoneyAccountToOption = (
  moneyAccount: MoneyAccount,
): DropdownOption => {
  const accountTypeLabel =
    moneyAccount.type === MoneyAccountType.Cash
      ? "Cash"
      : moneyAccount.type === MoneyAccountType.Bank
        ? "Bank"
        : "Wallet";
  const primarySuffix = moneyAccount.isPrimary ? " (Primary)" : "";

  return {
    label: `${moneyAccount.name} | ${accountTypeLabel}${primarySuffix}`,
    value: moneyAccount.remoteId,
  };
};

type OrderFinancialSnapshot = {
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDueAmount: number;
};

type ResolvedOrderLineSnapshot = {
  productName: string;
  unitLabel: string | null;
  unitPrice: number;
  taxRatePercent: number;
  lineSubtotalAmount: number;
  lineTaxAmount: number;
  lineTotalAmount: number;
};

export const toOrderFinancialSnapshot = (params: {
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  paidAmount: number;
}): OrderFinancialSnapshot => {
  const totalAmount = roundMoney(
    params.subtotalAmount + params.taxAmount - params.discountAmount,
  );
  const balanceDueAmount = Math.max(totalAmount - params.paidAmount, 0);

  return {
    subtotalAmount: params.subtotalAmount,
    taxAmount: params.taxAmount,
    discountAmount: params.discountAmount,
    totalAmount,
    paidAmount: params.paidAmount,
    balanceDueAmount,
  };
};

const resolveOrderLineDisplaySnapshot = (params: {
  item: OrderLine;
  productsByRemoteId: ReadonlyMap<string, Product>;
  fallbackTaxRatePercent: number;
}): ResolvedOrderLineSnapshot => {
  const { item, productsByRemoteId, fallbackTaxRatePercent } = params;
  const linkedProduct = productsByRemoteId.get(item.productRemoteId);
  const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;

  const unitPrice = hasValidMoneyValue(item.unitPriceSnapshot)
    ? item.unitPriceSnapshot
    : linkedProduct?.salePrice ?? 0;

  const taxRatePercent = hasValidMoneyValue(item.taxRatePercentSnapshot)
    ? item.taxRatePercentSnapshot
    : fallbackTaxRatePercent;

  const lineSubtotalAmount = hasValidMoneyValue(item.lineSubtotalAmount)
    ? item.lineSubtotalAmount
    : roundMoney(quantity * unitPrice);

  const lineTaxAmount = hasValidMoneyValue(item.lineTaxAmount)
    ? item.lineTaxAmount
    : roundMoney((lineSubtotalAmount * taxRatePercent) / 100);

  const lineTotalAmount = hasValidMoneyValue(item.lineTotalAmount)
    ? item.lineTotalAmount
    : roundMoney(lineSubtotalAmount + lineTaxAmount);

  return {
    productName:
      safeTrim(item.productNameSnapshot) ||
      linkedProduct?.name ||
      "Unknown item",
    unitLabel: item.unitLabelSnapshot ?? linkedProduct?.unitLabel ?? null,
    unitPrice,
    taxRatePercent,
    lineSubtotalAmount,
    lineTaxAmount,
    lineTotalAmount,
  };
};

const calculateOrderFinancialSnapshot = (params: {
  order: Order;
  productsByRemoteId: ReadonlyMap<string, Product>;
  settlementSnapshot: OrderSettlementSnapshot | null;
  fallbackTaxRatePercent: number;
}): OrderFinancialSnapshot => {
  const { order, productsByRemoteId, settlementSnapshot, fallbackTaxRatePercent } =
    params;

  const orderItems = Array.isArray(order.items) ? order.items : [];
  const resolvedLines = orderItems.map((item) =>
    resolveOrderLineDisplaySnapshot({
      item,
      productsByRemoteId,
      fallbackTaxRatePercent,
    }),
  );

  const subtotalAmount = hasValidMoneyValue(order.subtotalAmount)
    ? order.subtotalAmount
    : roundMoney(
        resolvedLines.reduce((sum, line) => sum + line.lineSubtotalAmount, 0),
      );

  const taxAmount = hasValidMoneyValue(order.taxAmount)
    ? order.taxAmount
    : roundMoney(resolvedLines.reduce((sum, line) => sum + line.lineTaxAmount, 0));

  const discountAmount = hasValidMoneyValue(order.discountAmount)
    ? order.discountAmount
    : 0;

  const paidAmount = settlementSnapshot?.paidAmount ?? 0;
  const fallbackBalance = Math.max(
    roundMoney(subtotalAmount + taxAmount - discountAmount) - paidAmount,
    0,
  );

  return {
    subtotalAmount,
    taxAmount,
    discountAmount,
    totalAmount: roundMoney(subtotalAmount + taxAmount - discountAmount),
    paidAmount,
    balanceDueAmount: settlementSnapshot?.balanceDueAmount ?? fallbackBalance,
  };
};

const buildItemsPreview = (
  order: Order,
  productsByRemoteId: ReadonlyMap<string, Product>,
): string => {
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const previewNames = orderItems.slice(0, 2).map((item) => {
    return (
      safeTrim(item.productNameSnapshot) ||
      productsByRemoteId.get(item.productRemoteId)?.name ||
      "Unknown item"
    );
  });

  if (orderItems.length <= 2) {
    return previewNames.join(", ") || "No items";
  }

  return `${previewNames.join(", ")} +${orderItems.length - 2} more`;
};

export const buildOrderListItemView = (params: {
  order: Order;
  settlementSnapshot: OrderSettlementSnapshot | null;
  contactsByRemoteId: ReadonlyMap<string, Contact>;
  productsByRemoteId: ReadonlyMap<string, Product>;
  taxRatePercent: number;
  currencyCode: string;
  countryCode: string | null;
}): OrderListItemView => {
  const {
    order,
    settlementSnapshot,
    contactsByRemoteId,
    productsByRemoteId,
    taxRatePercent,
    currencyCode,
    countryCode,
  } = params;

  const orderItems = Array.isArray(order.items) ? order.items : [];
  const customerName = order.customerRemoteId
    ? contactsByRemoteId.get(order.customerRemoteId)?.fullName ?? "Customer not found"
    : "No customer";

  const financialSnapshot = calculateOrderFinancialSnapshot({
    order,
    productsByRemoteId,
    settlementSnapshot,
    fallbackTaxRatePercent: taxRatePercent,
  });

  return {
    remoteId: order.remoteId,
    orderNumber: order.orderNumber,
    status: order.status,
    orderDateLabel: formatDateLabel(order.orderDate),
    customerName,
    paymentMethodLabel: normalizePaymentMethod(order.tags),
    itemCountLabel: `${orderItems.length} item${orderItems.length === 1 ? "" : "s"}`,
    itemsPreview: buildItemsPreview(order, productsByRemoteId),
    totalLabel: formatCurrencyAmount({
      amount: financialSnapshot.totalAmount,
      currencyCode,
      countryCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    balanceDueLabel:
      financialSnapshot.balanceDueAmount > 0
        ? formatCurrencyAmount({
            amount: financialSnapshot.balanceDueAmount,
            currencyCode,
            countryCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })
        : null,
  };
};

export const buildOrderDetailView = (params: {
  order: Order;
  settlementSnapshot: OrderSettlementSnapshot | null;
  contactsByRemoteId: ReadonlyMap<string, Contact>;
  productsByRemoteId: ReadonlyMap<string, Product>;
  taxRatePercent: number;
  currencyCode: string;
  countryCode: string | null;
}): OrderDetailView => {
  const {
    order,
    settlementSnapshot,
    contactsByRemoteId,
    productsByRemoteId,
    taxRatePercent,
    currencyCode,
    countryCode,
  } = params;

  const orderItems = Array.isArray(order.items) ? order.items : [];
  const customerContact = order.customerRemoteId
    ? contactsByRemoteId.get(order.customerRemoteId) ?? null
    : null;
  const customerName = order.customerRemoteId
    ? customerContact?.fullName ?? "Customer not found"
    : "No customer";

  const resolvedLines = orderItems.map((item) =>
    resolveOrderLineDisplaySnapshot({
      item,
      productsByRemoteId,
      fallbackTaxRatePercent: taxRatePercent,
    }),
  );

  const items: OrderDetailItemView[] = orderItems.map((item, index) => {
    const resolvedLine = resolvedLines[index];

    return {
      remoteId: item.remoteId,
      productName: resolvedLine.productName,
      quantityLabel: `${item.quantity}`,
      unitPriceLabel: formatCurrencyAmount({
        amount: resolvedLine.unitPrice,
        currencyCode,
        countryCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
      lineTotalLabel: formatCurrencyAmount({
        amount: resolvedLine.lineTotalAmount,
        currencyCode,
        countryCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    };
  });

  const financialSnapshot = calculateOrderFinancialSnapshot({
    order,
    productsByRemoteId,
    settlementSnapshot,
    fallbackTaxRatePercent: taxRatePercent,
  });

  const resolvedOrderTaxRatePercent = hasValidMoneyValue(order.taxRatePercent)
    ? order.taxRatePercent
    : taxRatePercent;

  const pricing: OrderDetailPricingView = {
    ...financialSnapshot,
    subtotalLabel: formatCurrencyAmount({
      amount: financialSnapshot.subtotalAmount,
      currencyCode,
      countryCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    taxLabel: formatCurrencyAmount({
      amount: financialSnapshot.taxAmount,
      currencyCode,
      countryCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    discountLabel: formatCurrencyAmount({
      amount: financialSnapshot.discountAmount,
      currencyCode,
      countryCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    totalLabel: formatCurrencyAmount({
      amount: financialSnapshot.totalAmount,
      currencyCode,
      countryCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    paidLabel: formatCurrencyAmount({
      amount: financialSnapshot.paidAmount,
      currencyCode,
      countryCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    balanceDueLabel: formatCurrencyAmount({
      amount: financialSnapshot.balanceDueAmount,
      currencyCode,
      countryCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    taxRateLabel: `${resolvedOrderTaxRatePercent}%`,
  };

  const canEdit = canEditOrderStructure({
    order,
    settlementSnapshot,
  });

  const canDelete = canDeleteOrder({
    order,
    settlementSnapshot,
  });

  const canChangeStatus = !isOrderTerminalStatus(order.status);

  return {
    order,
    customerName,
    customerPhone: customerContact?.phoneNumber ?? null,
    paymentMethodLabel: normalizePaymentMethod(order.tags),
    orderDateLabel: formatDateLabel(order.orderDate),
    items,
    pricing,
    canEdit,
    canDelete,
    canChangeStatus,
    editBlockedReason: getOrderEditBlockedReason({
      order,
      settlementSnapshot,
    }),
    deleteBlockedReason: getOrderDeleteBlockedReason({
      order,
      settlementSnapshot,
    }),
  };
};

export const calculateFormPricingPreview = (params: {
  form: OrderFormState;
  editorMode: "create" | "edit";
  orders: readonly Order[];
  settlementSnapshotsByOrderRemoteId: Readonly<Record<string, OrderSettlementSnapshot>>;
  productPriceByRemoteId: Readonly<Record<string, number>>;
  taxRatePercent: number;
  currencyCode: string;
  countryCode: string | null;
}): OrderFormPricingPreview => {
  const {
    form,
    editorMode,
    orders,
    settlementSnapshotsByOrderRemoteId,
    productPriceByRemoteId,
    taxRatePercent,
    currencyCode,
    countryCode,
  } = params;

  const formItems = Array.isArray(form.items) ? form.items : [];
  const lineSubtotalAmount = formItems.reduce((subtotal, item) => {
    const quantity = parseNumber(item.quantity) ?? 0;
    const salePrice = productPriceByRemoteId[item.productRemoteId] ?? 0;

    return subtotal + quantity * salePrice;
  }, 0);

  const editingOrder =
    editorMode === "edit" && form.remoteId
      ? orders.find((order) => order.remoteId === form.remoteId) ?? null
      : null;

  const paidAmount = editingOrder
    ? settlementSnapshotsByOrderRemoteId[editingOrder.remoteId]?.paidAmount ?? 0
    : 0;

  const financialSnapshot = toOrderFinancialSnapshot({
    subtotalAmount: roundMoney(lineSubtotalAmount),
    taxAmount: roundMoney((lineSubtotalAmount * taxRatePercent) / 100),
    discountAmount: 0,
    paidAmount,
  });

  return {
    ...financialSnapshot,
    subtotalLabel: formatCurrencyAmount({
      amount: financialSnapshot.subtotalAmount,
      currencyCode,
      countryCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    taxLabel: formatCurrencyAmount({
      amount: financialSnapshot.taxAmount,
      currencyCode,
      countryCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    discountLabel: formatCurrencyAmount({
      amount: financialSnapshot.discountAmount,
      currencyCode,
      countryCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    totalLabel: formatCurrencyAmount({
      amount: financialSnapshot.totalAmount,
      currencyCode,
      countryCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    paidLabel: formatCurrencyAmount({
      amount: financialSnapshot.paidAmount,
      currencyCode,
      countryCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    balanceDueLabel: formatCurrencyAmount({
      amount: financialSnapshot.balanceDueAmount,
      currencyCode,
      countryCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
    taxRateLabel: `${taxRatePercent}%`,
  };
};

export const buildStatusOptions = (): DropdownOption[] =>
  ORDER_STATUS_OPTIONS.map((option) => ({
    label: option.label,
    value: option.value,
  }));

export const buildOrderSummary = (orders: readonly Order[]) => ({
  totalOrders: orders.length,
  pendingCount: orders.filter((order) => order.status === OrderStatus.Pending).length,
  deliveredCount: orders.filter((order) => order.status === OrderStatus.Delivered)
    .length,
  returnedCount: orders.filter((order) => order.status === OrderStatus.Returned)
    .length,
});

export const resolveTaxRatePercent = (
  accountDefaultTaxRatePercent: number | null,
): number => {
  if (
    accountDefaultTaxRatePercent !== null &&
    Number.isFinite(accountDefaultTaxRatePercent) &&
    accountDefaultTaxRatePercent >= 0
  ) {
    return accountDefaultTaxRatePercent;
  }

  return DEFAULT_ORDER_TAX_RATE_PERCENT;
};

export const buildCustomerPhoneByRemoteId = (
  contacts: readonly Contact[],
): Readonly<Record<string, string | null>> =>
  contacts.reduce<Record<string, string | null>>((map, contact) => {
    map[contact.remoteId] = contact.phoneNumber;
    return map;
  }, {});

export const buildProductPriceByRemoteId = (
  products: readonly Product[],
): Readonly<Record<string, number>> =>
  products.reduce<Record<string, number>>((map, product) => {
    map[product.remoteId] = product.salePrice;
    return map;
  }, {});

export const buildCustomerOptions = (
  contacts: readonly Contact[],
): DropdownOption[] =>
  contacts
    .filter((contact) => !contact.isArchived)
    .map((contact) => ({
      label: contact.fullName,
      value: contact.remoteId,
    }));

export const buildProductOptions = (
  products: readonly Product[],
): DropdownOption[] =>
  products
    .filter((product) => product.status === "active")
    .map((product) => ({
      label: product.name,
      value: product.remoteId,
    }));
