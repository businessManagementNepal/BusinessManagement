import { Order, OrderStatusValue } from "@/feature/orders/types/order.types";

export type OrderListItemView = {
  remoteId: string;
  orderNumber: string;
  status: OrderStatusValue;
  orderDateLabel: string;
  customerName: string;
  paymentMethodLabel: string;
  itemCountLabel: string;
  itemsPreview: string;
  totalLabel: string;
  balanceDueLabel: string | null;
};

export type OrderDetailItemView = {
  remoteId: string;
  productName: string;
  quantity: number;
  quantityLabel: string;
  unitLabel: string | null;
  isInventoryTracked: boolean;
  unitPriceLabel: string;
  lineTotalLabel: string;
};

export type OrderDetailPricingView = {
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

export type OrderDetailView = {
  order: Order;
  customerName: string;
  customerPhone: string | null;
  paymentMethodLabel: string;
  orderDateLabel: string;
  items: OrderDetailItemView[];
  pricing: OrderDetailPricingView;

  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
  editBlockedReason: string | null;
  deleteBlockedReason: string | null;
};
