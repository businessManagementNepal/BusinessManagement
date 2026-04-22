import { ProductRepository } from "@/feature/products/data/repository/product.repository";
import { ProductKind } from "@/feature/products/types/product.types";
import {
  InventoryMovementSourceModule,
  InventoryMovementType,
  InventoryProductNotFoundError,
  InventoryValidationError,
} from "@/feature/inventory/types/inventory.types";
import { SaveInventoryMovementUseCase } from "./saveInventoryMovement.useCase";
import { CreateOpeningStockForProductUseCase } from "./createOpeningStockForProduct.useCase";

const buildOpeningStockMovementRemoteId = (productRemoteId: string): string =>
  `inv-opening-stock-${productRemoteId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

type Params = {
  productRepository: ProductRepository;
  saveInventoryMovementUseCase: SaveInventoryMovementUseCase;
};

export const createCreateOpeningStockForProductUseCase = ({
  productRepository,
  saveInventoryMovementUseCase,
}: Params): CreateOpeningStockForProductUseCase => ({
  async execute(payload) {
    const normalizedAccountRemoteId = payload.accountRemoteId.trim();
    const normalizedProductRemoteId = payload.productRemoteId.trim();

    if (!normalizedAccountRemoteId) {
      return {
        success: false,
        error: InventoryValidationError("Account remote id is required."),
      };
    }

    if (!normalizedProductRemoteId) {
      return {
        success: false,
        error: InventoryValidationError("Product remote id is required."),
      };
    }

    if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
      return {
        success: false,
        error: InventoryValidationError(
          "Opening stock quantity must be greater than zero.",
        ),
      };
    }

    if (!Number.isFinite(payload.movementAt) || payload.movementAt <= 0) {
      return {
        success: false,
        error: InventoryValidationError("A valid movement timestamp is required."),
      };
    }

    const productsResult = await productRepository.getProductsByAccountRemoteId(
      normalizedAccountRemoteId,
    );

    if (!productsResult.success) {
      return {
        success: false,
        error: InventoryValidationError(productsResult.error.message),
      };
    }

    const product = productsResult.value.find(
      (item) => item.remoteId === normalizedProductRemoteId,
    );

    if (!product) {
      return {
        success: false,
        error: InventoryProductNotFoundError,
      };
    }

    if (product.kind !== ProductKind.Item) {
      return {
        success: false,
        error: InventoryValidationError(
          "Opening stock can only be created for item products.",
        ),
      };
    }

    return saveInventoryMovementUseCase.execute({
      remoteId: buildOpeningStockMovementRemoteId(normalizedProductRemoteId),
      accountRemoteId: normalizedAccountRemoteId,
      productRemoteId: normalizedProductRemoteId,
      type: InventoryMovementType.OpeningStock,
      quantity: payload.quantity,
      unitRate: product.costPrice,
      reason: null,
      remark: "Opening stock from product creation.",
      sourceModule: InventoryMovementSourceModule.Products,
      sourceRemoteId: normalizedProductRemoteId,
      sourceLineRemoteId: null,
      sourceAction: "opening_stock_create",
      movementAt: payload.movementAt,
    });
  },
});
