import { Result } from "@/shared/types/result.types";

export const OrderStatus = {
  Draft: "draft",
  Pending: "pending",
  Confirmed: "confirmed",
  Processing: "processing",
  Ready: "ready",
  Shipped: "shipped",
  Delivered: "delivered",
  Cancelled: "cancelled",
  Returned: "returned",
} as const;

export type OrderStatusValue = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ORDER_STATUS_OPTIONS: readonly {
  label: string;
  value: OrderStatusValue;
}[] = [
  { label: "Draft", value: OrderStatus.Draft },
  { label: "Pending", value: OrderStatus.Pending },
  { label: "Confirmed", value: OrderStatus.Confirmed },
  { label: "Processing", value: OrderStatus.Processing },
  { label: "Ready", value: OrderStatus.Ready },
  { label: "Shipped", value: OrderStatus.Shipped },
  { label: "Delivered", value: OrderStatus.Delivered },
  { label: "Cancelled", value: OrderStatus.Cancelled },
  { label: "Returned", value: OrderStatus.Returned },
] as const;

export type OrderLine = {
  remoteId: string;
  orderRemoteId: string;
  productRemoteId: string;
  productNameSnapshot: string | null;
  unitLabelSnapshot: string | null;
  skuOrBarcodeSnapshot: string | null;
  categoryNameSnapshot: string | null;
  taxRateLabelSnapshot: string | null;
  unitPriceSnapshot: number | null;
  taxRatePercentSnapshot: number | null;
  quantity: number;
  lineSubtotalAmount: number | null;
  lineTaxAmount: number | null;
  lineTotalAmount: number | null;
  lineOrder: number;
  createdAt: number;
  updatedAt: number;
};

export type Order = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  orderNumber: string;
  orderDate: number;
  customerRemoteId: string | null;
  deliveryOrPickupDetails: string | null;
  notes: string | null;
  tags: string | null;
  internalRemarks: string | null;
  status: OrderStatusValue;
  taxRatePercent: number | null;
  subtotalAmount: number | null;
  taxAmount: number | null;
  discountAmount: number | null;
  totalAmount: number | null;
  linkedBillingDocumentRemoteId: string | null;
  linkedLedgerDueEntryRemoteId: string | null;
  items: OrderLine[];
  createdAt: number;
  updatedAt: number;
};

export type SaveOrderLinePayload = {
  remoteId: string;
  orderRemoteId: string;
  productRemoteId: string;
  productNameSnapshot?: string | null;
  unitLabelSnapshot?: string | null;
  skuOrBarcodeSnapshot?: string | null;
  categoryNameSnapshot?: string | null;
  taxRateLabelSnapshot?: string | null;
  unitPriceSnapshot?: number | null;
  taxRatePercentSnapshot?: number | null;
  quantity: number;
  lineSubtotalAmount?: number | null;
  lineTaxAmount?: number | null;
  lineTotalAmount?: number | null;
  lineOrder: number;
};

export type SaveOrderPayload = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  orderNumber: string;
  orderDate: number;
  customerRemoteId: string | null;
  deliveryOrPickupDetails: string | null;
  notes: string | null;
  tags: string | null;
  internalRemarks: string | null;
  status: OrderStatusValue;
  taxRatePercent?: number | null;
  subtotalAmount?: number | null;
  taxAmount?: number | null;
  discountAmount?: number | null;
  totalAmount?: number | null;
  linkedBillingDocumentRemoteId?: string | null;
  linkedLedgerDueEntryRemoteId?: string | null;
  items: SaveOrderLinePayload[];
};

export const OrderErrorType = {
  DatabaseError: "DATABASE_ERROR",
  ValidationError: "VALIDATION_ERROR",
  OrderNotFound: "ORDER_NOT_FOUND",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type OrderError = {
  type: (typeof OrderErrorType)[keyof typeof OrderErrorType];
  message: string;
};

export const OrderDatabaseError: OrderError = {
  type: OrderErrorType.DatabaseError,
  message: "Unable to process the order right now. Please try again.",
};

export const OrderValidationError = (message: string): OrderError => ({
  type: OrderErrorType.ValidationError,
  message,
});

export const OrderNotFoundError: OrderError = {
  type: OrderErrorType.OrderNotFound,
  message: "The requested order was not found.",
};

export const OrderUnknownError: OrderError = {
  type: OrderErrorType.UnknownError,
  message: "An unexpected order error occurred.",
};

export type OrderResult = Result<Order, OrderError>;
export type OrdersResult = Result<Order[], OrderError>;
export type OrderLineResult = Result<OrderLine, OrderError>;
export type OrderOperationResult = Result<boolean, OrderError>;
