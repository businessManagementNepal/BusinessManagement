import { ProductRepository } from "@/feature/products/data/repository/product.repository";
import {
  ProductKind,
  ProductValidationError,
} from "@/feature/products/types/product.types";
import { SaveProductUseCase } from "./saveProduct.useCase";

export const createSaveProductUseCase = (
  repository: ProductRepository,
): SaveProductUseCase => ({
  async execute(payload) {
    const normalizedRemoteId = payload.remoteId.trim();
    const normalizedAccountRemoteId = payload.accountRemoteId.trim();
    const normalizedName = payload.name.trim();

    if (!normalizedRemoteId) {
      return {
        success: false,
        error: ProductValidationError("Product remote id is required."),
      };
    }

    if (!normalizedAccountRemoteId) {
      return {
        success: false,
        error: ProductValidationError("Account remote id is required."),
      };
    }

    if (!normalizedName) {
      return {
        success: false,
        error: ProductValidationError("Product name is required."),
      };
    }

    if (payload.salePrice < 0) {
      return {
        success: false,
        error: ProductValidationError("Sale price cannot be negative."),
      };
    }

    if (
      payload.costPrice !== null &&
      Number.isFinite(payload.costPrice) &&
      payload.costPrice < 0
    ) {
      return {
        success: false,
        error: ProductValidationError("Cost price cannot be negative."),
      };
    }

    if (
      payload.kind !== ProductKind.Item &&
      payload.kind !== ProductKind.Service
    ) {
      return {
        success: false,
        error: ProductValidationError("Product type is invalid."),
      };
    }

    if (payload.kind === ProductKind.Service && payload.unitLabel !== null) {
      return {
        success: false,
        error: ProductValidationError(
          "Services cannot store an inventory unit label.",
        ),
      };
    }

    const existingProductsResult = await repository.getProductsByAccountRemoteId(
      normalizedAccountRemoteId,
    );

    if (!existingProductsResult.success) {
      return {
        success: false,
        error: existingProductsResult.error,
      };
    }

    const existingProduct = existingProductsResult.value.find(
      (product) => product.remoteId === normalizedRemoteId,
    );

    if (existingProduct && existingProduct.kind !== payload.kind) {
      return {
        success: false,
        error: ProductValidationError(
          "Product type cannot be changed after creation.",
        ),
      };
    }

    return repository.saveProduct({
      ...payload,
      remoteId: normalizedRemoteId,
      accountRemoteId: normalizedAccountRemoteId,
      name: normalizedName,
    });
  },
});
