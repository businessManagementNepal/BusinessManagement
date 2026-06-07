import { InventoryMovementType } from "@/feature/inventory/types/inventory.types";
import { createCreateOpeningStockForProductUseCase } from "@/feature/inventory/useCase/createOpeningStockForProduct.useCase.impl";
import { createCommitPosCheckoutInventoryUseCase } from "@/feature/pos/workflow/posCheckout/useCase/commitPosCheckoutInventory.useCase.impl";
import { createCreateProductWithOpeningStockUseCase } from "@/feature/products/useCase/createProductWithOpeningStock.useCase.impl";
import {
  ProductKind,
  ProductStatus,
  type Product,
  type SaveProductPayload,
} from "@/feature/products/types/product.types";
import { describe, expect, it, vi } from "vitest";

type StoredMovement = {
  remoteId: string;
  accountRemoteId: string;
  productRemoteId: string;
  type: string;
  quantity: number;
  sourceModule: string;
  sourceRemoteId: string;
};

const buildProductPayload = (
  overrides: Partial<SaveProductPayload> = {},
): SaveProductPayload => ({
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

const createHarness = () => {
  const products = new Map<string, Product>();
  const movements: StoredMovement[] = [];

  const saveProductUseCase = {
    execute: vi.fn(async (payload: SaveProductPayload) => {
      const saved: Product = {
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
        createdAt: 1,
        updatedAt: 1,
      };
      products.set(saved.remoteId, saved);
      return {
        success: true as const,
        value: saved,
      };
    }),
  };

  const deleteProductUseCase = {
    execute: vi.fn(async (remoteId: string) => {
      products.delete(remoteId);
      return {
        success: true as const,
        value: true,
      };
    }),
  };

  const saveInventoryMovementUseCase = {
    execute: vi.fn(async (payload: any) => {
      movements.push({
        remoteId: payload.remoteId,
        accountRemoteId: payload.accountRemoteId,
        productRemoteId: payload.productRemoteId,
        type: payload.type,
        quantity: payload.quantity,
        sourceModule: payload.sourceModule,
        sourceRemoteId: payload.sourceRemoteId,
      });
      return {
        success: true as const,
        value: payload,
      };
    }),
  };

  const saveInventoryMovementsUseCase = {
    execute: vi.fn(async (payloads: readonly any[]) => {
      payloads.forEach((payload) => {
        movements.push({
          remoteId: payload.remoteId,
          accountRemoteId: payload.accountRemoteId,
          productRemoteId: payload.productRemoteId,
          type: payload.type,
          quantity: payload.quantity,
          sourceModule: payload.sourceModule,
          sourceRemoteId: payload.sourceRemoteId,
        });
      });
      return {
        success: true as const,
        value: payloads,
      };
    }),
  };

  const getInventoryMovementsBySourceUseCase = {
    execute: vi.fn(async (payload: {
      accountRemoteId: string;
      sourceModule: string;
      sourceRemoteId: string;
    }) => ({
      success: true as const,
      value: movements.filter(
        (movement) =>
          movement.accountRemoteId === payload.accountRemoteId &&
          movement.sourceModule === payload.sourceModule &&
          movement.sourceRemoteId === payload.sourceRemoteId,
      ),
    })),
  };

  const createOpeningStockForProductUseCase = createCreateOpeningStockForProductUseCase({
    productRepository: {
      getProductsByAccountRemoteId: vi.fn(async (accountRemoteId: string) => ({
        success: true as const,
        value: [...products.values()].filter(
          (product) => product.accountRemoteId === accountRemoteId,
        ),
      })),
    } as any,
    saveInventoryMovementUseCase: saveInventoryMovementUseCase as any,
  });

  const createProductWithOpeningStockUseCase = createCreateProductWithOpeningStockUseCase({
    saveProductUseCase: saveProductUseCase as any,
    deleteProductUseCase: deleteProductUseCase as any,
    createOpeningStockForProductUseCase:
      createOpeningStockForProductUseCase as any,
  });

  const commitPosCheckoutInventoryUseCase = createCommitPosCheckoutInventoryUseCase({
    saveInventoryMovementsUseCase: saveInventoryMovementsUseCase as any,
    getInventoryMovementsBySourceUseCase:
      getInventoryMovementsBySourceUseCase as any,
  });

  const getProjectedStock = (productRemoteId: string) =>
    movements
      .filter((movement) => movement.productRemoteId === productRemoteId)
      .reduce((sum, movement) => {
        if (movement.type === InventoryMovementType.SaleOut) {
          return sum - movement.quantity;
        }

        return sum + movement.quantity;
      }, 0);

  return {
    movements,
    createProductWithOpeningStockUseCase,
    commitPosCheckoutInventoryUseCase,
    saveInventoryMovementsUseCase,
    getProjectedStock,
  };
};

describe("inventoryTruth.integration", () => {
  it("creates an opening stock movement and projects stock from that movement", async () => {
    const harness = createHarness();

    const result = await harness.createProductWithOpeningStockUseCase.execute({
      product: buildProductPayload(),
      openingStockQuantity: 20,
    });

    expect(result.success).toBe(true);
    expect(harness.movements).toHaveLength(1);
    expect(harness.movements[0]).toEqual(
      expect.objectContaining({
        type: InventoryMovementType.OpeningStock,
        quantity: 20,
      }),
    );
    expect(harness.getProjectedStock("product-1")).toBe(20);
  });

  it("records one sale-out movement for a POS sale and reduces projected stock once", async () => {
    const harness = createHarness();
    await harness.createProductWithOpeningStockUseCase.execute({
      product: buildProductPayload(),
      openingStockQuantity: 20,
    });

    const result = await harness.commitPosCheckoutInventoryUseCase.execute({
      businessAccountRemoteId: "business-1",
      saleRemoteId: "sale-1",
      saleReferenceNumber: "RCPT-001",
      movementAt: 1_710_000_000_000,
      cartLines: [
        {
          lineId: "line-1",
          productId: "product-1",
          productName: "Rice Bag",
          categoryLabel: "Groceries",
          shortCode: "RB",
          kind: ProductKind.Item,
          quantity: 3,
          unitPrice: 120,
          taxRate: 0,
          lineSubtotal: 360,
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(
      harness.movements.filter(
        (movement) => movement.type === InventoryMovementType.SaleOut,
      ),
    ).toHaveLength(1);
    expect(harness.getProjectedStock("product-1")).toBe(17);
  });

  it("does not duplicate stock movement when the same POS sale inventory commit is retried", async () => {
    const harness = createHarness();
    await harness.createProductWithOpeningStockUseCase.execute({
      product: buildProductPayload(),
      openingStockQuantity: 20,
    });

    await harness.commitPosCheckoutInventoryUseCase.execute({
      businessAccountRemoteId: "business-1",
      saleRemoteId: "sale-1",
      saleReferenceNumber: "RCPT-001",
      movementAt: 1_710_000_000_000,
      cartLines: [
        {
          lineId: "line-1",
          productId: "product-1",
          productName: "Rice Bag",
          categoryLabel: "Groceries",
          shortCode: "RB",
          kind: ProductKind.Item,
          quantity: 3,
          unitPrice: 120,
          taxRate: 0,
          lineSubtotal: 360,
        },
      ],
    });

    const retry = await harness.commitPosCheckoutInventoryUseCase.execute({
      businessAccountRemoteId: "business-1",
      saleRemoteId: "sale-1",
      saleReferenceNumber: "RCPT-001",
      movementAt: 1_710_000_000_000,
      cartLines: [
        {
          lineId: "line-1",
          productId: "product-1",
          productName: "Rice Bag",
          categoryLabel: "Groceries",
          shortCode: "RB",
          kind: ProductKind.Item,
          quantity: 3,
          unitPrice: 120,
          taxRate: 0,
          lineSubtotal: 360,
        },
      ],
    });

    expect(retry.success).toBe(true);
    expect(harness.saveInventoryMovementsUseCase.execute).toHaveBeenCalledTimes(1);
    expect(
      harness.movements.filter(
        (movement) => movement.type === InventoryMovementType.SaleOut,
      ),
    ).toHaveLength(1);
    expect(harness.getProjectedStock("product-1")).toBe(17);
  });
});
