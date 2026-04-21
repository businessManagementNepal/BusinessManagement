import { GetProductsUseCase } from "../../products/useCase/getProducts.useCase";
import { OrderRepository } from "../data/repository/order.repository";
import {
    OrderResult,
    OrderValidationError,
    SaveOrderPayload,
} from "../types/order.types";
import {
    isOrderFinancialStatus,
} from "../utils/orderCommercialEffects.util";
import { mapOrderToSaveOrderPayload } from "../utils/orderCommercialSyncRollback.util";
import { getOrderEditBlockedReason } from "../utils/orderLifecyclePolicy.util";
import {
    buildOrderSnapshotPayload,
    validateOrderDraftPayload,
} from "./buildOrderSnapshotPayload.util";
import { EnsureOrderBillingAndDueLinksUseCase } from "./ensureOrderBillingAndDueLinks.useCase";
import { GetOrderSettlementSnapshotsUseCase } from "./getOrderSettlementSnapshots.useCase";
import { UpdateOrderUseCase } from "./updateOrder.useCase";
import { validateOrderPersistenceReadyPayload } from "./validateOrderPersistenceReadyPayload.util";

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
  getOrderSettlementSnapshotsUseCase: GetOrderSettlementSnapshotsUseCase;
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

    // Add identity protection
    if (payload.accountRemoteId.trim() !== previousOrder.accountRemoteId.trim()) {
      return {
        success: false,
        error: OrderValidationError("Order account context cannot be changed."),
      };
    }

    if (payload.ownerUserRemoteId.trim() !== previousOrder.ownerUserRemoteId.trim()) {
      return {
        success: false,
        error: OrderValidationError("Order owner context cannot be changed."),
      };
    }

    // Add lifecycle boundary check
    const snapshotResult = await params.getOrderSettlementSnapshotsUseCase.execute({
      accountRemoteId: previousOrder.accountRemoteId,
      ownerUserRemoteId: previousOrder.ownerUserRemoteId,
      orders: [previousOrder],
      attemptLegacyRepair: true,
    });

    if (!snapshotResult.success) {
      return {
        success: false,
        error: OrderValidationError(snapshotResult.error.message),
      };
    }

    const settlementSnapshot = snapshotResult.value[previousOrder.remoteId] ?? null;

    const blockedReason = getOrderEditBlockedReason({
      order: previousOrder,
      settlementSnapshot,
    });

    if (blockedReason) {
      return {
        success: false,
        error: OrderValidationError(blockedReason),
      };
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
      existingOrder: previousOrder,
    });

    if (!snapshotPayloadResult.success) {
      return {
        success: false,
        error: OrderValidationError(snapshotPayloadResult.error),
      };
    }

    const persistenceReadyValidation = validateOrderPersistenceReadyPayload(
      snapshotPayloadResult.value,
    );

    if (!persistenceReadyValidation.success) {
      return {
        success: false,
        error: OrderValidationError(persistenceReadyValidation.error),
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
