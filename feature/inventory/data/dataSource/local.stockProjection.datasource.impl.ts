import { InventoryMovementModel } from "@/feature/inventory/data/dataSource/db/inventoryMovement.model";
import { ProductModel } from "@/feature/products/data/dataSource/db/product.model";
import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import { StockProjectionDatasource } from "./stockProjection.datasource";

const PRODUCTS_TABLE = "products";
const INVENTORY_MOVEMENTS_TABLE = "inventory_movements";

const setUpdatedAt = (record: ProductModel, now: number): void => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

export const createLocalStockProjectionDatasource = (
  database: Database,
): StockProjectionDatasource => ({
  async getActiveStockProductsByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<ProductModel[]>> {
    try {
      const collection = database.get<ProductModel>(PRODUCTS_TABLE);
      const records = await collection
        .query(
          Q.where("account_remote_id", accountRemoteId),
          Q.where("deleted_at", Q.eq(null)),
          Q.where("kind", "item"),
        )
        .fetch();

      return {
        success: true,
        value: records,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getInventoryMovementsByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<InventoryMovementModel[]>> {
    try {
      const collection = database.get<InventoryMovementModel>(
        INVENTORY_MOVEMENTS_TABLE,
      );
      const records = await collection
        .query(
          Q.where("account_remote_id", accountRemoteId),
          Q.where("deleted_at", Q.eq(null)),
        )
        .fetch();

      return {
        success: true,
        value: records,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async replaceStockQuantities(
    stockByProductRemoteId: Readonly<Record<string, number>>,
  ): Promise<Result<boolean>> {
    try {
      const remoteIds = Object.keys(stockByProductRemoteId);
      if (remoteIds.length === 0) {
        return { success: true, value: true };
      }

      const collection = database.get<ProductModel>(PRODUCTS_TABLE);
      const products = await collection
        .query(Q.where("remote_id", Q.oneOf(remoteIds)))
        .fetch();

      await database.write(async () => {
        const now = Date.now();
        for (const product of products) {
          await product.update((record) => {
            record.stockQuantity = stockByProductRemoteId[product.remoteId] ?? 0;
            setUpdatedAt(record, now);
          });
        }
      });

      return {
        success: true,
        value: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
