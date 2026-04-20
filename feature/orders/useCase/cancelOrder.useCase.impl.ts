import { OrderRepository } from "@/feature/orders/data/repository/order.repository";
import {
    OrderStatus,
    OrderStatusValue,
    OrderValidationError,
} from "@/feature/orders/types/order.types";
import { CancelOrderUseCase } from "./cancelOrder.useCase";

const CANCELABLE_ORDER_STATUSES = new Set<OrderStatusValue>([
  OrderStatus.Draft,
  OrderStatus.Pending,
]);

const hasCommercialLinks = (params: {
  linkedBillingDocumentRemoteId: string | null;
  linkedLedgerDueEntryRemoteId: string | null;
}): boolean =>
  Boolean(params.linkedBillingDocumentRemoteId?.trim()) ||
  Boolean(params.linkedLedgerDueEntryRemoteId?.trim());

export const createCancelOrderUseCase = (
  repository: OrderRepository,
): CancelOrderUseCase => ({
  async execute(remoteId: string) {
    const normalizedRemoteId = remoteId.trim();
    if (!normalizedRemoteId) {
      return {
        success: false,
        error: OrderValidationError("Order remote id is required."),
      };
    }

    const orderResult = await repository.getOrderByRemoteId(normalizedRemoteId);
    if (!orderResult.success) {
      return orderResult;
    }

    const order = orderResult.value;

    if (order.status === OrderStatus.Cancelled) {
      return {
        success: true,
        value: order,
      };
    }

    if (!CANCELABLE_ORDER_STATUSES.has(order.status)) {
      return {
        success: false,
        error: OrderValidationError(
          "Only draft or pending orders can be cancelled. Use return/refund flow for commercially active orders.",
        ),
      };
    }

    if (
      hasCommercialLinks({
        linkedBillingDocumentRemoteId: order.linkedBillingDocumentRemoteId,
        linkedLedgerDueEntryRemoteId: order.linkedLedgerDueEntryRemoteId,
      })
    ) {
      return {
        success: false,
        error: OrderValidationError(
          "This order already has commercial links and cannot be cancelled from the simple cancel flow.",
        ),
      };
    }

    return repository.updateOrderStatusByRemoteId(
      normalizedRemoteId,
      OrderStatus.Cancelled,
    );
  },
});
