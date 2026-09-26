import {
  InventoryAdjustmentDirection,
  InventoryAdjustmentReason,
  InventoryMovementType,
  SaveInventoryMovementPayload,
} from "@/feature/inventory/types/inventory.types";
import { Product, ProductKind } from "@/feature/products/types/product.types";

export type ValidatedInventoryMovementPayload = {
  remoteId: string;
  accountRemoteId: string;
  productRemoteId: string;
  type: SaveInventoryMovementPayload["type"];
  quantity: number;
  unitRate: number | null;
  reason: SaveInventoryMovementPayload["reason"];
  adjustmentDirection: SaveInventoryMovementPayload["adjustmentDirection"];
  remark: string | null;
  sourceModule: string | null;
  sourceRemoteId: string | null;
  sourceLineRemoteId: string | null;
  sourceAction: string | null;
  movementAt: number;
};

type ResolveInventoryDeltaQuantityParams = {
  movementType: SaveInventoryMovementPayload["type"];
  quantity: number;
  reason?: SaveInventoryMovementPayload["reason"];
  adjustmentDirection?: SaveInventoryMovementPayload["adjustmentDirection"];
};

export type CountCorrectionResolution = {
  quantity: number;
  adjustmentDirection:
    | typeof InventoryAdjustmentDirection.Add
    | typeof InventoryAdjustmentDirection.Remove;
  deltaQuantity: number;
};

export const resolveCountCorrection = (
  currentStock: number,
  physicalStockCount: number,
): CountCorrectionResolution => {
  if (!Number.isFinite(currentStock)) {
    throw new Error("Current stock must be a finite number");
  }

  if (!Number.isFinite(physicalStockCount) || physicalStockCount < 0) {
    throw new Error("Physical stock count cannot be negative");
  }

  const deltaQuantity = physicalStockCount - currentStock;
  if (deltaQuantity === 0) {
    throw new Error("Physical stock count already matches current stock");
  }

  return {
    quantity: Math.abs(deltaQuantity),
    adjustmentDirection:
      deltaQuantity > 0
        ? InventoryAdjustmentDirection.Add
        : InventoryAdjustmentDirection.Remove,
    deltaQuantity,
  };
};

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const assertKnownMovementType = (
  type: SaveInventoryMovementPayload["type"],
): void => {
  const allowedTypes = new Set(Object.values(InventoryMovementType));
  if (!allowedTypes.has(type)) {
    throw new Error("Inventory movement type is invalid");
  }
};

const assertKnownAdjustmentReason = (
  reason: SaveInventoryMovementPayload["reason"],
): void => {
  if (reason === null) {
    return;
  }

  const allowedReasons = new Set(Object.values(InventoryAdjustmentReason));
  if (!allowedReasons.has(reason)) {
    throw new Error("Inventory adjustment reason is invalid");
  }
};

export const resolveInventoryDeltaQuantity = ({
  movementType,
  quantity,
  reason = null,
  adjustmentDirection = null,
}: ResolveInventoryDeltaQuantityParams): number => {
  if (
    movementType === InventoryMovementType.StockIn ||
    movementType === InventoryMovementType.OpeningStock
  ) {
    return quantity;
  }

  if (movementType === InventoryMovementType.SaleOut) {
    return quantity * -1;
  }

  if (movementType !== InventoryMovementType.Adjustment) {
    throw new Error("Inventory movement type is invalid");
  }

  if (!reason) {
    throw new Error("Adjustment reason is required");
  }

  if (
    reason === InventoryAdjustmentReason.Damage ||
    reason === InventoryAdjustmentReason.Expired ||
    reason === InventoryAdjustmentReason.Lost
  ) {
    return quantity * -1;
  }

  if (reason === InventoryAdjustmentReason.ReturnedNonSellable) {
    return 0;
  }

  if (
    reason === InventoryAdjustmentReason.Correction ||
    reason === InventoryAdjustmentReason.Other
  ) {
    if (adjustmentDirection === InventoryAdjustmentDirection.Add) {
      return quantity;
    }

    if (adjustmentDirection === InventoryAdjustmentDirection.Remove) {
      return quantity * -1;
    }

    throw new Error(
      reason === InventoryAdjustmentReason.Correction
        ? "Count correction direction is required"
        : "Choose whether the other adjustment adds or removes stock",
    );
  }

  throw new Error("Inventory adjustment reason is invalid");
};

const normalizeInventoryMovementPayload = (
  payload: SaveInventoryMovementPayload,
): ValidatedInventoryMovementPayload => {
  const normalizedRemoteId = normalizeRequired(payload.remoteId);
  const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
  const normalizedProductRemoteId = normalizeRequired(payload.productRemoteId);
  const normalizedSourceModule = normalizeOptional(payload.sourceModule);
  const normalizedSourceRemoteId = normalizeOptional(payload.sourceRemoteId);
  const normalizedSourceLineRemoteId = normalizeOptional(payload.sourceLineRemoteId);
  const normalizedSourceAction = normalizeOptional(payload.sourceAction);
  const normalizedRemark = normalizeOptional(payload.remark);
  const adjustmentDirection = payload.adjustmentDirection ?? null;

  if (!normalizedRemoteId) {
    throw new Error("Inventory movement remote id is required");
  }

  if (!normalizedAccountRemoteId) {
    throw new Error("Account remote id is required");
  }

  if (!normalizedProductRemoteId) {
    throw new Error("Product remote id is required");
  }

  assertKnownMovementType(payload.type);
  assertKnownAdjustmentReason(payload.reason);

  if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
    throw new Error("Inventory movement quantity must be greater than zero");
  }

  if (payload.type === InventoryMovementType.Adjustment) {
    if (!payload.reason) {
      throw new Error("Adjustment reason is required");
    }

    if (
      (payload.reason === InventoryAdjustmentReason.Correction ||
        payload.reason === InventoryAdjustmentReason.Other) &&
      adjustmentDirection !== InventoryAdjustmentDirection.Add &&
      adjustmentDirection !== InventoryAdjustmentDirection.Remove
    ) {
      throw new Error(
        payload.reason === InventoryAdjustmentReason.Correction
          ? "Count correction direction is required"
          : "Choose whether the other adjustment adds or removes stock",
      );
    }
  } else if (payload.reason !== null) {
    throw new Error("Adjustment reason can only be used for stock adjustments");
  }

  if (!Number.isFinite(payload.movementAt) || payload.movementAt <= 0) {
    throw new Error("Movement timestamp is required");
  }

  if (normalizedSourceModule && !normalizedSourceRemoteId) {
    throw new Error("Inventory movement source remote id is required");
  }

  if (
    !normalizedSourceModule &&
    (normalizedSourceRemoteId !== null ||
      normalizedSourceLineRemoteId !== null ||
      normalizedSourceAction !== null)
  ) {
    throw new Error("Inventory movement source module is required");
  }

  if (
    payload.unitRate !== null &&
    (!Number.isFinite(payload.unitRate) || payload.unitRate < 0)
  ) {
    throw new Error("Inventory unit rate cannot be negative");
  }

  return {
    remoteId: normalizedRemoteId,
    accountRemoteId: normalizedAccountRemoteId,
    productRemoteId: normalizedProductRemoteId,
    type: payload.type,
    quantity: payload.quantity,
    unitRate: payload.unitRate,
    reason: payload.reason,
    adjustmentDirection,
    remark: normalizedRemark,
    sourceModule: normalizedSourceModule,
    sourceRemoteId: normalizedSourceRemoteId,
    sourceLineRemoteId: normalizedSourceLineRemoteId,
    sourceAction: normalizedSourceAction,
    movementAt: payload.movementAt,
  };
};

export const validateInventoryMovementPayloadsForSave = (params: {
  payloads: readonly SaveInventoryMovementPayload[];
  products: readonly Product[];
}): ValidatedInventoryMovementPayload[] => {
  if (params.payloads.length === 0) {
    throw new Error("At least one inventory movement payload is required");
  }

  const normalizedPayloads = params.payloads.map(normalizeInventoryMovementPayload);
  const batchAccountRemoteId = normalizedPayloads[0].accountRemoteId;
  const movementRemoteIds = new Set<string>();
  const productByRemoteId = new Map(
    params.products.map((product) => [product.remoteId, product]),
  );
  const nextStockByProductRemoteId = new Map<string, number>();

  for (const payload of normalizedPayloads) {
    if (payload.accountRemoteId !== batchAccountRemoteId) {
      throw new Error(
        "All inventory movement payloads in one save operation must belong to the same account",
      );
    }

    if (movementRemoteIds.has(payload.remoteId)) {
      throw new Error("Duplicate inventory movement remote id in batch");
    }
    movementRemoteIds.add(payload.remoteId);

    const product = productByRemoteId.get(payload.productRemoteId);
    if (!product) {
      throw new Error(`Product with remote id ${payload.productRemoteId} not found`);
    }

    if (product.accountRemoteId !== payload.accountRemoteId) {
      throw new Error("Product does not belong to the selected account");
    }

    if (product.kind !== ProductKind.Item) {
      throw new Error("Inventory movement can only be recorded for item products");
    }

    const currentStock =
      nextStockByProductRemoteId.get(product.remoteId) ??
      (product.stockQuantity ?? 0);

    const deltaQuantity = resolveInventoryDeltaQuantity({
      movementType: payload.type,
      quantity: payload.quantity,
      reason: payload.reason,
      adjustmentDirection: payload.adjustmentDirection,
    });

    const nextStock = currentStock + deltaQuantity;

    if (nextStock < 0 && deltaQuantity < 0) {
      throw new Error(`Inventory movement would reduce ${product.name} below zero`);
    }

    nextStockByProductRemoteId.set(product.remoteId, nextStock);
  }

  return normalizedPayloads;
};
