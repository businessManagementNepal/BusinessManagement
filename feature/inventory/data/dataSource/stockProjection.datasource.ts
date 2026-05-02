import { InventoryMovementModel } from "@/feature/inventory/data/dataSource/db/inventoryMovement.model";
import { ProductModel } from "@/feature/products/data/dataSource/db/product.model";
import { Result } from "@/shared/types/result.types";

export interface StockProjectionDatasource {
  getActiveStockProductsByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<ProductModel[]>>;

  getInventoryMovementsByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<InventoryMovementModel[]>>;

  replaceStockQuantities(
    stockByProductRemoteId: Readonly<Record<string, number>>,
  ): Promise<Result<boolean>>;
}
