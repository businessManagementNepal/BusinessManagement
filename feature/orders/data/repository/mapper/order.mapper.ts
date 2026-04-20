import { OrderLineModel } from "@/feature/orders/data/dataSource/db/orderLine.model";
import { OrderRecordBundle } from "@/feature/orders/data/dataSource/order.datasource";
import { Order, OrderLine } from "@/feature/orders/types/order.types";

export const mapOrderLineModelToDomain = (model: OrderLineModel): OrderLine => ({
  remoteId: model.remoteId,
  orderRemoteId: model.orderRemoteId,
  productRemoteId: model.productRemoteId,
  productNameSnapshot: model.productNameSnapshot,
  unitLabelSnapshot: model.unitLabelSnapshot,
  skuOrBarcodeSnapshot: model.skuOrBarcodeSnapshot,
  categoryNameSnapshot: model.categoryNameSnapshot,
  taxRateLabelSnapshot: model.taxRateLabelSnapshot,
  unitPriceSnapshot: model.unitPriceSnapshot,
  taxRatePercentSnapshot: model.taxRatePercentSnapshot,
  quantity: model.quantity,
  lineSubtotalAmount: model.lineSubtotalAmount,
  lineTaxAmount: model.lineTaxAmount,
  lineTotalAmount: model.lineTotalAmount,
  lineOrder: model.lineOrder,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

export const mapOrderRecordBundleToDomain = (bundle: OrderRecordBundle): Order => ({
  remoteId: bundle.order.remoteId,
  ownerUserRemoteId: bundle.order.ownerUserRemoteId,
  accountRemoteId: bundle.order.accountRemoteId,
  orderNumber: bundle.order.orderNumber,
  orderDate: bundle.order.orderDate,
  customerRemoteId: bundle.order.customerRemoteId,
  deliveryOrPickupDetails: bundle.order.deliveryOrPickupDetails,
  notes: bundle.order.notes,
  tags: bundle.order.tags,
  internalRemarks: bundle.order.internalRemarks,
  status: bundle.order.status,
  taxRatePercent: bundle.order.taxRatePercent,
  subtotalAmount: bundle.order.subtotalAmount,
  taxAmount: bundle.order.taxAmount,
  discountAmount: bundle.order.discountAmount,
  totalAmount: bundle.order.totalAmount,
  linkedBillingDocumentRemoteId: bundle.order.linkedBillingDocumentRemoteId,
  linkedLedgerDueEntryRemoteId: bundle.order.linkedLedgerDueEntryRemoteId,
  items: bundle.items.map(mapOrderLineModelToDomain),
  createdAt: bundle.order.createdAt.getTime(),
  updatedAt: bundle.order.updatedAt.getTime(),
});
