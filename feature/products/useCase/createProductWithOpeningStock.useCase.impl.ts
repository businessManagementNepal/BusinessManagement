import { CreateOpeningStockForProductUseCase } from "@/feature/inventory/useCase/createOpeningStockForProduct.useCase";
import {
  ProductKind,
  ProductUnknownError,
  ProductValidationError,
} from "@/feature/products/types/product.types";
import { DeleteProductUseCase } from "./deleteProduct.useCase";
import { SaveProductUseCase } from "./saveProduct.useCase";
import { CreateProductWithOpeningStockUseCase } from "./createProductWithOpeningStock.useCase";

type Params = {
  saveProductUseCase: SaveProductUseCase;
  deleteProductUseCase: DeleteProductUseCase;
  createOpeningStockForProductUseCase: CreateOpeningStockForProductUseCase;
};

export const createCreateProductWithOpeningStockUseCase = ({
  saveProductUseCase,
  deleteProductUseCase,
  createOpeningStockForProductUseCase,
}: Params): CreateProductWithOpeningStockUseCase => ({
  async execute(payload) {
    if (
      payload.openingStockQuantity !== null &&
      !Number.isFinite(payload.openingStockQuantity)
    ) {
      return {
        success: false,
        error: ProductValidationError("Opening stock must be a valid number."),
      };
    }

    if (
      payload.openingStockQuantity !== null &&
      payload.openingStockQuantity < 0
    ) {
      return {
        success: false,
        error: ProductValidationError("Opening stock cannot be negative."),
      };
    }

    if (
      payload.product.kind === ProductKind.Service &&
      payload.openingStockQuantity !== null &&
      payload.openingStockQuantity > 0
    ) {
      return {
        success: false,
        error: ProductValidationError(
          "Services cannot be created with opening stock.",
        ),
      };
    }

    const productSaveResult = await saveProductUseCase.execute(payload.product);

    if (!productSaveResult.success) {
      return productSaveResult;
    }

    const shouldCreateOpeningStock =
      productSaveResult.value.kind === ProductKind.Item &&
      payload.openingStockQuantity !== null &&
      payload.openingStockQuantity > 0;
    const openingStockQuantity = payload.openingStockQuantity ?? 0;

    if (!shouldCreateOpeningStock) {
      return productSaveResult;
    }

    const openingStockResult = await createOpeningStockForProductUseCase.execute({
      accountRemoteId: productSaveResult.value.accountRemoteId,
      productRemoteId: productSaveResult.value.remoteId,
      quantity: openingStockQuantity,
      movementAt: Date.now(),
    });

    if (openingStockResult.success) {
      return productSaveResult;
    }

    const rollbackResult = await deleteProductUseCase.execute(
      productSaveResult.value.remoteId,
    );

    if (!rollbackResult.success) {
      return {
        success: false,
        error: {
          ...ProductUnknownError,
          message:
            "Opening stock could not be posted and product rollback failed. Please review product records.",
        },
      };
    }

    return {
      success: false,
      error: ProductValidationError(openingStockResult.error.message),
    };
  },
});
