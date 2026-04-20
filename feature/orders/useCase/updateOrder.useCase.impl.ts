import { OrderRepository } from "@/feature/orders/data/repository/order.repository";
import {
  OrderResult,
  OrderValidationError,
  SaveOrderPayload,
} from "@/feature/orders/types/order.types";
import {
  isOrderFinancialStatus,
} from "@/feature/orders/utils/orderCommercialEffects.util";
import { mapOrderToSaveOrderPayload } from "@/feature/orders/utils/orderCommercialSyncRollback.util";
import { GetProductsUseCase } from "@/feature/products/useCase/getProducts.useCase";
import {
  buildOrderSnapshotPayload,
  validateOrderDraftPayload,
} from "./buildOrderSnapshotPayload.util";
import { EnsureOrderBillingAndDueLinksUseCase } from "./ensureOrderBillingAndDueLinks.useCase";
import { UpdateOrderUseCase } from "./updateOrder.useCase";

const buildRollbackAwareValidationError = (params: {
  primaryMessage: string;
  rollbackMessage: string | null;
}) =>
  OrderValidationError(
    params.rollbackMessage
      ? `${params.primaryMessage} Rollback failed: ${params.rollbackMessage}`
      : params.primaryMessage,
  );

export const createUpdateOrderUseCase = (params: {
  repository: OrderRepository;
  getProductsUseCase: GetProductsUseCase;
  ensureOrderBillingAndDueLinksUseCase: EnsureOrderBillingAndDueLinksUseCase;
}): UpdateOrderUseCase => ({
  async execute(payload: SaveOrderPayload): Promise<OrderResult> {
    const validationError = validateOrderDraftPayload(payload);
    if (validationError) {
      return { success: false, error: OrderValidationError(validationError) };
    }

    const existingOrderResult = await params.repository.getOrderByRemoteId(
      payload.remoteId.trim(),
    );
    if (!existingOrderResult.success) {
      return { success: false, error: existingOrderResult.error };
    }

    const previousOrder = existingOrderResult.value;

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
      existingOrder: previousOrder,
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

    const rollbackResult = await params.repository.saveOrder(
      mapOrderToSaveOrderPayload(previousOrder),
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
