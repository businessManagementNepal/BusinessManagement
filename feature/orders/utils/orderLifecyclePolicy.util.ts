import { Order, OrderStatus, OrderStatusValue } from "../types/order.types";
import { OrderSettlementSnapshot } from "../types/orderSettlement.dto.types";

export const isOrderTerminalStatus = (status: OrderStatusValue): boolean =>
  status === OrderStatus.Delivered ||
  status === OrderStatus.Returned ||
  status === OrderStatus.Cancelled;

export const isOrderCommerciallyActiveStatus = (status: OrderStatusValue): boolean =>
  status === OrderStatus.Confirmed ||
  status === OrderStatus.Processing ||
  status === OrderStatus.Ready ||
  status === OrderStatus.Shipped ||
  status === OrderStatus.Delivered ||
  status === OrderStatus.Returned;

export const hasCommercialAnchors = (order: Order): boolean =>
  Boolean(order.linkedBillingDocumentRemoteId?.trim()) ||
  Boolean(order.linkedLedgerDueEntryRemoteId?.trim());

export const hasSettlementActivity = (
  snapshot: OrderSettlementSnapshot | null | undefined,
): boolean =>
  Boolean(
    snapshot &&
      (
        snapshot.paidAmount > 0 ||
        snapshot.refundedAmount > 0 ||
        snapshot.balanceDueAmount > 0 ||
        snapshot.billingDocumentRemoteId ||
        snapshot.dueEntryRemoteId
      ),
  );

export const canEditOrderStructure = (params: {
  order: Order;
  settlementSnapshot?: OrderSettlementSnapshot | null;
}): boolean => {
  const { order, settlementSnapshot } = params;

  if (order.status === OrderStatus.Draft || order.status === OrderStatus.Pending) {
    return !hasCommercialAnchors(order) && !hasSettlementActivity(settlementSnapshot);
  }

  return false;
};

export const canDeleteOrder = (params: {
  order: Order;
  settlementSnapshot?: OrderSettlementSnapshot | null;
}): boolean => {
  const { order, settlementSnapshot } = params;

  if (order.status !== OrderStatus.Draft && order.status !== OrderStatus.Pending) {
    return false;
  }

  if (hasCommercialAnchors(order)) {
    return false;
  }

  if (hasSettlementActivity(settlementSnapshot)) {
    return false;
  }

  return true;
};

export const getOrderEditBlockedReason = (params: {
  order: Order;
  settlementSnapshot?: OrderSettlementSnapshot | null;
}): string | null => {
  if (canEditOrderStructure(params)) {
    return null;
  }

  return "Only draft or pending orders with no commercial or settlement activity can be edited.";
};

export const getOrderDeleteBlockedReason = (params: {
  order: Order;
  settlementSnapshot?: OrderSettlementSnapshot | null;
}): string | null => {
  if (canDeleteOrder(params)) {
    return null;
  }

  return "Only draft or pending orders with no commercial or settlement activity can be deleted.";
};
