import { InventoryErrorType } from "@/feature/inventory/types/inventory.types";
import { createCreateProductWithOpeningStockUseCase } from "@/feature/products/useCase/createProductWithOpeningStock.useCase.impl";
import {
  ProductErrorType,
  ProductKind,
  ProductStatus,
  SaveProductPayload,
} from "@/feature/products/types/product.types";
import { describe, expect, it, vi } from "vitest";

const buildPayload = (overrides: Partial<SaveProductPayload> = {}): SaveProductPayload => ({
  remoteId: "product-1",
  accountRemoteId: "business-1",
  name: "Rice Bag",
  kind: ProductKind.Item,
  categoryName: "Groceries",
  salePrice: 120,
  costPrice: 100,
  unitLabel: "bag",
  skuOrBarcode: "SKU-1",
  taxRateLabel: "VAT",
  description: null,
  imageUrl: null,
  status: ProductStatus.Active,
  ...overrides,
});

const buildSavedProduct = (payload: SaveProductPayload) => ({
  remoteId: payload.remoteId,
  accountRemoteId: payload.accountRemoteId,
  name: payload.name,
  kind: payload.kind,
  categoryName: payload.categoryName,
  salePrice: payload.salePrice,
  costPrice: payload.costPrice,
  stockQuantity: payload.kind === ProductKind.Item ? 0 : null,
  unitLabel: payload.unitLabel,
  skuOrBarcode: payload.skuOrBarcode,
  taxRateLabel: payload.taxRateLabel,
  description: payload.description,
  imageUrl: payload.imageUrl,
  status: payload.status,
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
});

describe("createProductWithOpeningStockUseCase", () => {
  it("creates product and posts opening stock for item products", async () => {
    const payload = buildPayload();

    const saveProductUseCase = {
      execute: vi.fn(async (value: SaveProductPayload) => ({
        success: true as const,
        value: buildSavedProduct(value),
      })),
    };
    const createOpeningStockForProductUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "movement-1",
        },
      })),
    };
    const deleteProductUseCase = { execute: vi.fn() };

    const useCase = createCreateProductWithOpeningStockUseCase({
      saveProductUseCase: saveProductUseCase as any,
      deleteProductUseCase: deleteProductUseCase as any,
      createOpeningStockForProductUseCase:
        createOpeningStockForProductUseCase as any,
    });

    const result = await useCase.execute({
      product: payload,
      openingStockQuantity: 8,
    });

    expect(result.success).toBe(true);
    expect(saveProductUseCase.execute).toHaveBeenCalledTimes(1);
    expect(createOpeningStockForProductUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deleteProductUseCase.execute).not.toHaveBeenCalled();
  });

  it("creates product without inventory posting when opening stock is empty", async () => {
    const payload = buildPayload();

    const saveProductUseCase = {
      execute: vi.fn(async (value: SaveProductPayload) => ({
        success: true as const,
        value: buildSavedProduct(value),
      })),
    };
    const createOpeningStockForProductUseCase = {
      execute: vi.fn(),
    };
    const deleteProductUseCase = { execute: vi.fn() };

    const useCase = createCreateProductWithOpeningStockUseCase({
      saveProductUseCase: saveProductUseCase as any,
      deleteProductUseCase: deleteProductUseCase as any,
      createOpeningStockForProductUseCase:
        createOpeningStockForProductUseCase as any,
    });

    const result = await useCase.execute({
      product: payload,
      openingStockQuantity: null,
    });

    expect(result.success).toBe(true);
    expect(createOpeningStockForProductUseCase.execute).not.toHaveBeenCalled();
    expect(deleteProductUseCase.execute).not.toHaveBeenCalled();
  });

  it("rolls back created product when opening stock posting fails", async () => {
    const payload = buildPayload();

    const saveProductUseCase = {
      execute: vi.fn(async (value: SaveProductPayload) => ({
        success: true as const,
        value: buildSavedProduct(value),
      })),
    };
    const createOpeningStockForProductUseCase = {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: InventoryErrorType.ValidationError,
          message: "Inventory posting failed.",
        },
      })),
    };
    const deleteProductUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    };

    const useCase = createCreateProductWithOpeningStockUseCase({
      saveProductUseCase: saveProductUseCase as any,
      deleteProductUseCase: deleteProductUseCase as any,
      createOpeningStockForProductUseCase:
        createOpeningStockForProductUseCase as any,
    });

    const result = await useCase.execute({
      product: payload,
      openingStockQuantity: 5,
    });

    expect(result.success).toBe(false);
    expect(createOpeningStockForProductUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deleteProductUseCase.execute).toHaveBeenCalledWith("product-1");
    if (!result.success) {
      expect(result.error.type).toBe(ProductErrorType.ValidationError);
      expect(result.error.message).toContain("Inventory posting failed");
    }
  });

  it("rejects service product with opening stock", async () => {
    const payload = buildPayload({
      kind: ProductKind.Service,
      unitLabel: null,
    });

    const saveProductUseCase = { execute: vi.fn() };
    const createOpeningStockForProductUseCase = { execute: vi.fn() };
    const deleteProductUseCase = { execute: vi.fn() };

    const useCase = createCreateProductWithOpeningStockUseCase({
      saveProductUseCase: saveProductUseCase as any,
      deleteProductUseCase: deleteProductUseCase as any,
      createOpeningStockForProductUseCase:
        createOpeningStockForProductUseCase as any,
    });

    const result = await useCase.execute({
      product: payload,
      openingStockQuantity: 3,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe(ProductErrorType.ValidationError);
      expect(result.error.message).toContain("Services cannot be created");
    }
    expect(saveProductUseCase.execute).not.toHaveBeenCalled();
    expect(createOpeningStockForProductUseCase.execute).not.toHaveBeenCalled();
    expect(deleteProductUseCase.execute).not.toHaveBeenCalled();
  });
});
