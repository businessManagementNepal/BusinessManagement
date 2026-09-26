import { OrderStatusValue } from "@/feature/orders/types/order.types";

export type OrderLineFormFieldName = "productRemoteId" | "quantity";

export type OrderLineFormFieldErrors = Partial<
  Record<OrderLineFormFieldName, string>
>;

export type OrderLineFormState = {
  remoteId: string;
  productRemoteId: string;
  quantity: string;
  fieldErrors: OrderLineFormFieldErrors;
};

export type OrderFormFieldName = "items";

export type OrderFormFieldErrors = Partial<
  Record<OrderFormFieldName, string>
>;

export type OrderFormState = {
  remoteId: string | null;
  orderNumber: string;
  orderDate: string;
  customerRemoteId: string;
  deliveryOrPickupDetails: string;
  notes: string;
  tags: string;
  internalRemarks: string;
  status: OrderStatusValue;
  items: OrderLineFormState[];
  fieldErrors: OrderFormFieldErrors;
};

export type OrderFormPricingPreview = {
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDueAmount: number;
  subtotalLabel: string;
  taxLabel: string;
  discountLabel: string;
  totalLabel: string;
  paidLabel: string;
  balanceDueLabel: string;
  taxRateLabel: string;
};

export type OrderSummaryState = {
  totalOrders: number;
  pendingCount: number;
  deliveredCount: number;
  returnedCount: number;
};

export type OrderReturnDispositionLineState = {
  lineRemoteId: string;
  productName: string;
  orderedQuantity: number;
  unitLabel: string | null;
  sellableQuantity: string;
  nonSellableQuantity: string;
  errorMessage: string | null;
};

export type OrderReturnDispositionFormState = {
  visible: boolean;
  orderRemoteId: string | null;
  orderNumber: string;
  lines: OrderReturnDispositionLineState[];
};

export type OrderMoneyActionValue = "payment" | "refund";

export type OrderMoneyFormFieldName =
  | "amount"
  | "happenedAt"
  | "settlementMoneyAccountRemoteId";

export type OrderMoneyFormFieldErrors = Partial<
  Record<OrderMoneyFormFieldName, string>
>;

export type OrderMoneyFormState = {
  visible: boolean;
  action: OrderMoneyActionValue;
  orderRemoteId: string | null;
  orderNumber: string;
  amount: string;
  happenedAt: string;
  settlementMoneyAccountRemoteId: string;
  note: string;
  attemptRemoteId: string | null;
  fieldErrors: OrderMoneyFormFieldErrors;
};
