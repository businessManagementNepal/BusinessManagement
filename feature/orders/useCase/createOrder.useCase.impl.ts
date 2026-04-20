import { OrderRepository } from "@/feature/orders/data/repository/order.repository";
import {
  OrderResult,
  OrderValidationError,
  SaveOrderPayload,
} from "@/feature/orders/types/order.types";
import { isOrderFinancialStatus } from "@/feature/orders/utils/orderCommercialEffects.util";
import { GetProductsUseCase } from "@/feature/products/useCase/getProducts.useCase";
import {
  buildOrderSnapshotPayload,
  validateOrderDraftPayload,
} from "./buildOrderSnapshotPayload.util";
import { CreateOrderUseCase } from "./createOrder.useCase";
import { DeleteOrderUseCase } from "./deleteOrder.useCase";
import { EnsureOrderBillingAndDueLinksUseCase } from "./ensureOrderBillingAndDueLinks.useCase";

const buildRollbackAwareValidationError = (params: {
  primaryMessage: string;
  rollbackMessage: string | null;
}) =>
  OrderValidationError(
    params.rollbackMessage
      ? `${params.primaryMessage} Rollback failed: ${params.rollbackMessage}`
      : params.primaryMessage,
  );

export const createCreateOrderUseCase = (params: {
  repository: OrderRepository;
  getProductsUseCase: GetProductsUseCase;
  deleteOrderUseCase: DeleteOrderUseCase;
  ensureOrderBillingAndDueLinksUseCase: EnsureOrderBillingAndDueLinksUseCase;
}): CreateOrderUseCase => ({
  async execute(payload: SaveOrderPayload): Promise<OrderResult> {
    const validationError = validateOrderDraftPayload(payload);
    if (validationError) {
      return { success: false, error: OrderValidationError(validationError) };
    }

    const productsResult = await params.getProductsUseCase.execute(
      payload.accountRemoteId.trim(),
    );
    if (!productsResult.success) {
      return {
        success: false,
        error: OrderValidationError(productsResult.error.message),
      };
    }

    const snapshotPayloadResult = buildOrderSnapshotPayload({
      payload,
      products: productsResult.value,
      existingOrder: null,
    });

    if (!snapshotPayloadResult.success) {
      return {
        success: false,
        error: OrderValidationError(snapshotPayloadResult.error),
      };
    }

    const saveResult = await params.repository.saveOrder(
      snapshotPayloadResult.value,
    );
    if (!saveResult.success) {
      return saveResult;
    }

    if (!isOrderFinancialStatus(saveResult.value.status)) {
      return saveResult;
    }

    const ensureResult =
      await params.ensureOrderBillingAndDueLinksUseCase.execute(
        saveResult.value.remoteId,
      );

    if (ensureResult.success) {
      return saveResult;
    }

    const rollbackResult = await params.deleteOrderUseCase.execute(
      saveResult.value.remoteId,
    );

    return {
      success: false,
      error: buildRollbackAwareValidationError({
        primaryMessage: ensureResult.error.message,
        rollbackMessage: rollbackResult.success
          ? null
          : rollbackResult.error.message,
      }),
    };
  },
});
