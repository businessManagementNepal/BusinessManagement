import { OrderRepository } from "@/feature/orders/data/repository/order.repository";
import {
  OrderStatusValue,
  OrderValidationError,
} from "@/feature/orders/types/order.types";
import { isOrderFinancialStatus } from "@/feature/orders/utils/orderCommercialEffects.util";
import { EnsureOrderBillingAndDueLinksUseCase } from "./ensureOrderBillingAndDueLinks.useCase";
import { ChangeOrderStatusUseCase } from "./changeOrderStatus.useCase";

export const createChangeOrderStatusUseCase = (params: {
  repository: OrderRepository;
  ensureOrderBillingAndDueLinksUseCase: EnsureOrderBillingAndDueLinksUseCase;
}): ChangeOrderStatusUseCase => ({
  async execute(paramsInput: { remoteId: string; status: OrderStatusValue }) {
    const normalizedRemoteId = paramsInput.remoteId.trim();
    if (!normalizedRemoteId) {
      return {
        success: false,
        error: OrderValidationError("Order remote id is required."),
      };
    }

    const currentOrderResult = await params.repository.getOrderByRemoteId(
      normalizedRemoteId,
    );
    if (!currentOrderResult.success) {
      return { success: false, error: currentOrderResult.error };
    }

    const updateResult = await params.repository.updateOrderStatusByRemoteId(
      normalizedRemoteId,
      paramsInput.status,
    );
    if (!updateResult.success) {
      return updateResult;
    }

    if (!isOrderFinancialStatus(paramsInput.status)) {
      return updateResult;
    }

    const ensureResult =
      await params.ensureOrderBillingAndDueLinksUseCase.execute(normalizedRemoteId);

    if (!ensureResult.success) {
      const revertResult = await params.repository.updateOrderStatusByRemoteId(
        normalizedRemoteId,
        currentOrderResult.value.status,
      );

      if (!revertResult.success) {
        return { success: false, error: revertResult.error };
      }

      return {
        success: false,
        error: ensureResult.error,
      };
    }

    return params.repository.getOrderByRemoteId(normalizedRemoteId);
  },
});
