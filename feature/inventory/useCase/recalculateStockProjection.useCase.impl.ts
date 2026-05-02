import { StockProjectionDatasource } from "../data/dataSource/stockProjection.datasource";
import { RecalculateStockProjectionUseCase } from "./recalculateStockProjection.useCase";

export const createRecalculateStockProjectionUseCase = (
  datasource: StockProjectionDatasource,
): RecalculateStockProjectionUseCase => ({
  async execute(input) {
    const productsResult =
      await datasource.getActiveStockProductsByAccountRemoteId(
        input.accountRemoteId,
      );
    if (!productsResult.success) {
      return productsResult;
    }

    const movementsResult =
      await datasource.getInventoryMovementsByAccountRemoteId(
        input.accountRemoteId,
      );
    if (!movementsResult.success) {
      return movementsResult;
    }

    const stockByProductRemoteId: Record<string, number> = Object.fromEntries(
      productsResult.value.map((product) => [product.remoteId, 0]),
    );

    for (const movement of movementsResult.value) {
      const currentQuantity = stockByProductRemoteId[movement.productRemoteId] ?? 0;
      stockByProductRemoteId[movement.productRemoteId] =
        currentQuantity + movement.deltaQuantity;
    }

    return datasource.replaceStockQuantities(stockByProductRemoteId);
  },
});
