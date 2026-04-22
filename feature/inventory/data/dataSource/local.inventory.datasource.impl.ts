import {
  InventoryMovementType,
  SaveInventoryMovementPayload,
  InventorySourceLookupParams,
} from "@/feature/inventory/types/inventory.types";
import { ProductModel } from "@/feature/products/data/dataSource/db/product.model";
import { RecordSyncStatus } from "@/feature/session/types/authSession.types";
import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import { InventoryMovementModel } from "./db/inventoryMovement.model";
import { InventoryDatasource } from "./inventory.datasource";

const PRODUCTS_TABLE = "products";
const INVENTORY_MOVEMENTS_TABLE = "inventory_movements";

const normalizeRequired = (value: string): string => value.trim();
const normalizeOptional = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const setCreatedAndUpdatedAt = (
  record: InventoryMovementModel | ProductModel,
  now: number,
): void => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (
  record: InventoryMovementModel | ProductModel,
  now: number,
): void => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateSyncStatusOnMutation = (
  record: InventoryMovementModel | ProductModel,
): void => {
  if (!record.recordSyncStatus || record.recordSyncStatus === RecordSyncStatus.Synced) {
    record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
  }
};

const resolveDeltaQuantity = (
  movementType: SaveInventoryMovementPayload["type"],
  quantity: number,
): number => {
  if (
    movementType === InventoryMovementType.StockIn ||
    movementType === InventoryMovementType.OpeningStock ||
    movementType === InventoryMovementType.Adjustment
  ) {
    return quantity;
  }

  if (movementType === InventoryMovementType.SaleOut) {
    return quantity * -1;
  }

  throw new Error("Inventory movement type is invalid");
};

type NormalizedMovementPayload = {
  remoteId: string;
  accountRemoteId: string;
  productRemoteId: string;
  type: SaveInventoryMovementPayload["type"];
  quantity: number;
  unitRate: number | null;
  reason: SaveInventoryMovementPayload["reason"];
  remark: string | null;
  sourceModule: string | null;
  sourceRemoteId: string | null;
  sourceLineRemoteId: string | null;
  sourceAction: string | null;
  movementAt: number;
};

const normalizeMovementPayload = (
  payload: SaveInventoryMovementPayload,
): NormalizedMovementPayload => {
  const normalizedRemoteId = normalizeRequired(payload.remoteId);
  const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
  const normalizedProductRemoteId = normalizeRequired(payload.productRemoteId);
  const normalizedSourceModule = normalizeOptional(payload.sourceModule ?? null);
  const normalizedSourceRemoteId = normalizeOptional(payload.sourceRemoteId ?? null);
  const normalizedSourceLineRemoteId = normalizeOptional(
    payload.sourceLineRemoteId ?? null,
  );
  const normalizedSourceAction = normalizeOptional(payload.sourceAction ?? null);
  const normalizedRemark = normalizeOptional(payload.remark ?? null);

  if (!normalizedRemoteId) {
    throw new Error("Inventory movement remote id is required");
  }

  if (!normalizedAccountRemoteId) {
    throw new Error("Account remote id is required");
  }

  if (!normalizedProductRemoteId) {
    throw new Error("Product remote id is required");
  }

  if (!payload.type) {
    throw new Error("Inventory movement type is required");
  }

  if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
    throw new Error("Inventory movement quantity must be greater than zero");
  }

  if (!Number.isFinite(payload.movementAt) || payload.movementAt <= 0) {
    throw new Error("Movement timestamp is required");
  }

  if (normalizedSourceModule && !normalizedSourceRemoteId) {
    throw new Error("Inventory movement source remote id is required");
  }

  return {
    remoteId: normalizedRemoteId,
    accountRemoteId: normalizedAccountRemoteId,
    productRemoteId: normalizedProductRemoteId,
    type: payload.type,
    quantity: payload.quantity,
    unitRate: payload.unitRate,
    reason: payload.reason,
    remark: normalizedRemark,
    sourceModule: normalizedSourceModule,
    sourceRemoteId: normalizedSourceRemoteId,
    sourceLineRemoteId: normalizedSourceLineRemoteId,
    sourceAction: normalizedSourceAction,
    movementAt: payload.movementAt,
  };
};

export const createLocalInventoryDatasource = (
  database: Database,
): InventoryDatasource => ({
  async getStockProductsByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<ProductModel[]>> {
    try {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);
      if (!normalizedAccountRemoteId) {
        throw new Error("Account remote id is required");
      }

      const collection = database.get<ProductModel>(PRODUCTS_TABLE);
      const products = await collection
        .query(
          Q.where("account_remote_id", normalizedAccountRemoteId),
          Q.where("kind", "item"),
          Q.where("deleted_at", Q.eq(null)),
          Q.where("status", "active"),
          Q.sortBy("updated_at", Q.desc),
        )
        .fetch();

      return { success: true, value: products };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getInventoryMovementsByAccountRemoteId(
    accountRemoteId: string,
    limit: number,
  ): Promise<Result<InventoryMovementModel[]>> {
    try {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);
      if (!normalizedAccountRemoteId) {
        throw new Error("Account remote id is required");
      }

      const collection = database.get<InventoryMovementModel>(
        INVENTORY_MOVEMENTS_TABLE,
      );
      const movements = await collection
        .query(
          Q.where("account_remote_id", normalizedAccountRemoteId),
          Q.where("deleted_at", Q.eq(null)),
          Q.sortBy("movement_at", Q.desc),
          Q.take(limit),
        )
        .fetch();

      return { success: true, value: movements };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getInventoryMovementsBySource(
    params: InventorySourceLookupParams,
  ): Promise<Result<InventoryMovementModel[]>> {
    try {
      const normalizedAccountRemoteId = normalizeRequired(params.accountRemoteId);
      const normalizedSourceModule = normalizeRequired(params.sourceModule);
      const normalizedSourceRemoteId = normalizeRequired(params.sourceRemoteId);

      if (!normalizedAccountRemoteId) {
        throw new Error("Account remote id is required");
      }
      if (!normalizedSourceModule) {
        throw new Error("Inventory movement source module is required");
      }
      if (!normalizedSourceRemoteId) {
        throw new Error("Inventory movement source remote id is required");
      }

      const collection = database.get<InventoryMovementModel>(
        INVENTORY_MOVEMENTS_TABLE,
      );

      const movements = await collection
        .query(
          Q.where("account_remote_id", normalizedAccountRemoteId),
          Q.where("source_module", normalizedSourceModule),
          Q.where("source_remote_id", normalizedSourceRemoteId),
          Q.where("deleted_at", Q.eq(null)),
          Q.sortBy("movement_at", Q.asc),
          Q.sortBy("updated_at", Q.asc),
        )
        .fetch();

      return { success: true, value: movements };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async saveInventoryMovement(
    payload: SaveInventoryMovementPayload,
  ): Promise<Result<InventoryMovementModel>> {
    const result = await this.saveInventoryMovements([payload]);
    if (!result.success) {
      return result as Result<InventoryMovementModel>;
    }
    return { success: true, value: result.value[0] };
  },

  async saveInventoryMovements(
    payloads: readonly SaveInventoryMovementPayload[],
  ): Promise<Result<InventoryMovementModel[]>> {
    try {
      if (payloads.length === 0) {
        throw new Error("At least one inventory movement payload is required");
      }

      const normalizedPayloads = payloads.map(normalizeMovementPayload);
      const uniqueProductRemoteIds = Array.from(
        new Set(normalizedPayloads.map((payload) => payload.productRemoteId)),
      );
      const movementCollection = database.get<InventoryMovementModel>(
        INVENTORY_MOVEMENTS_TABLE,
      );
      const productCollection = database.get<ProductModel>(PRODUCTS_TABLE);

      const createdMovements = await database.write(async () => {
        const now = Date.now();
        const movements: InventoryMovementModel[] = [];
        const products = await productCollection
          .query(
            Q.where("remote_id", Q.oneOf(uniqueProductRemoteIds)),
            Q.where("deleted_at", Q.eq(null)),
          )
          .fetch();
        const productByRemoteId = new Map(
          products.map((product) => [product.remoteId, product]),
        );
        const nextStockByProductRemoteId = new Map<string, number>();

        for (const payload of normalizedPayloads) {
          const product = productByRemoteId.get(payload.productRemoteId);
          if (!product) {
            throw new Error(
              `Product with remote id ${payload.productRemoteId} not found`,
            );
          }

          if (product.accountRemoteId !== payload.accountRemoteId) {
            throw new Error("Product does not belong to the selected account");
          }

          if (product.kind !== "item") {
            throw new Error(
              "Inventory movement can only be recorded for item products",
            );
          }

          const currentStock =
            nextStockByProductRemoteId.get(product.remoteId) ??
            (product.stockQuantity ?? 0);
          const deltaQuantity = resolveDeltaQuantity(payload.type, payload.quantity);
          const nextStock = currentStock + deltaQuantity;

          if (nextStock < 0) {
            throw new Error(`Inventory movement would reduce ${product.name} below zero`);
          }

          nextStockByProductRemoteId.set(product.remoteId, nextStock);

          const record = await movementCollection.create((movement) => {
            movement.remoteId = payload.remoteId;
            movement.accountRemoteId = payload.accountRemoteId;
            movement.productRemoteId = payload.productRemoteId;
            movement.productNameSnapshot = product.name;
            movement.productUnitLabelSnapshot = product.unitLabel;
            movement.movementType = payload.type;
            movement.quantity = payload.quantity;
            movement.deltaQuantity = deltaQuantity;
            movement.unitRate = payload.unitRate;
            movement.reason = payload.reason;
            movement.remark = payload.remark;
            movement.sourceModule = payload.sourceModule;
            movement.sourceRemoteId = payload.sourceRemoteId;
            movement.sourceLineRemoteId = payload.sourceLineRemoteId;
            movement.sourceAction = payload.sourceAction;
            movement.movementAt = payload.movementAt;
            movement.recordSyncStatus = RecordSyncStatus.PendingCreate;
            movement.lastSyncedAt = null;
            movement.deletedAt = null;
            setCreatedAndUpdatedAt(movement, now);
          });

          movements.push(record);
        }

        for (const [productRemoteId, nextStock] of nextStockByProductRemoteId) {
          const product = productByRemoteId.get(productRemoteId);
          if (!product) {
            continue;
          }

          await product.update((record) => {
            record.stockQuantity = nextStock;
            updateSyncStatusOnMutation(record);
            setUpdatedAt(record, now);
          });
        }

        return movements;
      });

      return { success: true, value: createdMovements };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async deleteInventoryMovementsByRemoteIds(
    remoteIds: readonly string[],
  ): Promise<Result<boolean>> {
    try {
      const normalizedRemoteIds = remoteIds
        .map((id) => normalizeRequired(id))
        .filter((id) => id.length > 0);

      if (normalizedRemoteIds.length === 0) {
        throw new Error("At least one valid remote id is required");
      }

      const collection = database.get<InventoryMovementModel>(
        INVENTORY_MOVEMENTS_TABLE,
      );

      await database.write(async () => {
        const movements = await collection
          .query(
            Q.where("remote_id", Q.oneOf(normalizedRemoteIds)),
            Q.where("deleted_at", Q.eq(null)),
          )
          .fetch();

        for (const movement of movements) {
          await movement.markAsDeleted();
          updateSyncStatusOnMutation(movement);
        }
      });

      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
