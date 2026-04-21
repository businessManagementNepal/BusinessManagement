import { OrderRepository } from "@/feature/orders/data/repository/order.repository";
import { OrderOperationResult, OrderValidationError } from "@/feature/orders/types/order.types";
import { getOrderDeleteBlockedReason } from "@/feature/orders/utils/orderLifecyclePolicy.util";
import { DeleteOrderUseCase } from "./deleteOrder.useCase";
import { GetOrderSettlementSnapshotsUseCase } from "./getOrderSettlementSnapshots.useCase";

export const createDeleteOrderUseCase = (params: {
  repository: OrderRepository;
  getOrderSettlementSnapshotsUseCase: GetOrderSettlementSnapshotsUseCase;
}): DeleteOrderUseCase => ({
  async execute(remoteId: string): Promise<OrderOperationResult> {
    const normalizedRemoteId = remoteId.trim();
    if (!normalizedRemoteId) {
      return { success: false, error: OrderValidationError("Order remote id is required.") };
    }

    const orderResult = await params.repository.getOrderByRemoteId(normalizedRemoteId);
    if (!orderResult.success) {
      return {
        success: false,
        error: orderResult.error,
      };
    }

    const order = orderResult.value;

    const snapshotResult = await params.getOrderSettlementSnapshotsUseCase.execute({
      accountRemoteId: order.accountRemoteId,
      ownerUserRemoteId: order.ownerUserRemoteId,
      orders: [order],
      attemptLegacyRepair: true,
    });

    if (!snapshotResult.success) {
      return {
        success: false,
        error: OrderValidationError(snapshotResult.error.message),
      };
    }

    const settlementSnapshot = snapshotResult.value[order.remoteId] ?? null;

    const blockedReason = getOrderDeleteBlockedReason({
      order,
      settlementSnapshot,
    });

    if (blockedReason) {
      return {
        success: false,
        error: OrderValidationError(blockedReason),
      };
    }

    return params.repository.deleteOrderByRemoteId(normalizedRemoteId);
  },
});
