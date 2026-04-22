import { createCreateOpeningStockForProductUseCase } from "@/feature/inventory/useCase/createOpeningStockForProduct.useCase.impl";
import { InventoryErrorType, InventoryMovementSourceModule, InventoryMovementType } from "@/feature/inventory/types/inventory.types";
import { ProductKind, ProductStatus } from "@/feature/products/types/product.types";
import { describe, expect, it, vi } from "vitest";

const buildProduct = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "product-1",
  accountRemoteId: "business-1",
  name: "Rice Bag",
  kind: ProductKind.Item,
  categoryName: "Groceries",
  salePrice: 120,
  costPrice: 100,
  stockQuantity: 0,
  unitLabel: "bag",
  skuOrBarcode: "SKU-1",
  taxRateLabel: "VAT",
  description: null,
  imageUrl: null,
  status: ProductStatus.Active,
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

describe("createOpeningStockForProductUseCase", () => {
  it("creates an opening stock movement for item products", async () => {
    const productRepository = {
      getProductsByAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [buildProduct()],
      })),
    };

    const saveInventoryMovementUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "movement-1",
          accountRemoteId: "business-1",
          productRemoteId: "product-1",
          productName: "Rice Bag",
          productUnitLabel: "bag",
          type: InventoryMovementType.OpeningStock,
          quantity: 10,
          deltaQuantity: 10,
          unitRate: 100,
          totalValue: 1000,
          reason: null,
          remark: "Opening stock from product creation.",
          sourceModule: InventoryMovementSourceModule.Products,
          sourceRemoteId: "product-1",
          sourceLineRemoteId: null,
          sourceAction: "opening_stock_create",
          movementAt: 1_710_000_000_000,
          createdAt: 1_710_000_000_000,
          updatedAt: 1_710_000_000_000,
        },
      })),
    };

    const useCase = createCreateOpeningStockForProductUseCase({
      productRepository: productRepository as any,
      saveInventoryMovementUseCase: saveInventoryMovementUseCase as any,
    });

    const result = await useCase.execute({
      accountRemoteId: "business-1",
      productRemoteId: "product-1",
      quantity: 10,
      movementAt: 1_710_000_000_000,
    });

    expect(result.success).toBe(true);
    expect(saveInventoryMovementUseCase.execute).toHaveBeenCalledTimes(1);
    const firstMovementPayload = (saveInventoryMovementUseCase.execute as any).mock
      .calls[0]?.[0];
    expect(firstMovementPayload).toMatchObject({
      accountRemoteId: "business-1",
      productRemoteId: "product-1",
      type: InventoryMovementType.OpeningStock,
      quantity: 10,
      sourceModule: InventoryMovementSourceModule.Products,
      sourceRemoteId: "product-1",
      sourceAction: "opening_stock_create",
    });
  });

  it("rejects non-item products", async () => {
    const productRepository = {
      getProductsByAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [buildProduct({ kind: ProductKind.Service })],
      })),
    };

    const saveInventoryMovementUseCase = { execute: vi.fn() };

    const useCase = createCreateOpeningStockForProductUseCase({
      productRepository: productRepository as any,
      saveInventoryMovementUseCase: saveInventoryMovementUseCase as any,
    });

    const result = await useCase.execute({
      accountRemoteId: "business-1",
      productRemoteId: "product-1",
      quantity: 5,
      movementAt: 1_710_000_000_000,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe(InventoryErrorType.ValidationError);
      expect(result.error.message).toContain("item products");
    }
    expect(saveInventoryMovementUseCase.execute).not.toHaveBeenCalled();
  });

  it("rejects when product cannot be found", async () => {
    const productRepository = {
      getProductsByAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [],
      })),
    };

    const saveInventoryMovementUseCase = { execute: vi.fn() };

    const useCase = createCreateOpeningStockForProductUseCase({
      productRepository: productRepository as any,
      saveInventoryMovementUseCase: saveInventoryMovementUseCase as any,
    });

    const result = await useCase.execute({
      accountRemoteId: "business-1",
      productRemoteId: "missing-product",
      quantity: 2,
      movementAt: 1_710_000_000_000,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe(InventoryErrorType.ProductNotFound);
    }
    expect(saveInventoryMovementUseCase.execute).not.toHaveBeenCalled();
  });

  it("rejects non-positive quantity", async () => {
    const productRepository = {
      getProductsByAccountRemoteId: vi.fn(),
    };
    const saveInventoryMovementUseCase = { execute: vi.fn() };

    const useCase = createCreateOpeningStockForProductUseCase({
      productRepository: productRepository as any,
      saveInventoryMovementUseCase: saveInventoryMovementUseCase as any,
    });

    const result = await useCase.execute({
      accountRemoteId: "business-1",
      productRemoteId: "product-1",
      quantity: 0,
      movementAt: 1_710_000_000_000,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe(InventoryErrorType.ValidationError);
      expect(result.error.message).toContain("greater than zero");
    }
    expect(productRepository.getProductsByAccountRemoteId).not.toHaveBeenCalled();
    expect(saveInventoryMovementUseCase.execute).not.toHaveBeenCalled();
  });
});
