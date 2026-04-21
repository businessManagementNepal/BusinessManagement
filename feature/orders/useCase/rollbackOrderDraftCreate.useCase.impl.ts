import { OrderRepository } from "@/feature/orders/data/repository/order.repository";
import {
  OrderOperationResult,
  OrderValidationError,
} from "@/feature/orders/types/order.types";
import { RollbackOrderDraftCreateUseCase } from "./rollbackOrderDraftCreate.useCase";

export const createRollbackOrderDraftCreateUseCase = (params: {
  repository: OrderRepository;
}): RollbackOrderDraftCreateUseCase => ({
  async execute(remoteId: string): Promise<OrderOperationResult> {
    const normalizedRemoteId = remoteId.trim();

    if (!normalizedRemoteId) {
      return {
        success: false,
        error: OrderValidationError("Order remote id is required."),
      };
    }

    const orderResult = await params.repository.getOrderByRemoteId(normalizedRemoteId);
    if (!orderResult.success) {
      return {
        success: false,
        error: orderResult.error,
      };
    }

    const order = orderResult.value;

    // This rollback use case exists only for compensating a failed order create flow.
    // It is intentionally not a public delete path and must not be used from UI flows.
    return params.repository.deleteOrderByRemoteId(order.remoteId);
  },
});
