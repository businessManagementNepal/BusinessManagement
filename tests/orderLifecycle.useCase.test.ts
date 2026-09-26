import { OrderStatus } from "@/feature/orders/types/order.types";
import { createCancelOrderUseCase } from "@/feature/orders/useCase/cancelOrder.useCase.impl";
import { createReturnOrderUseCase } from "@/feature/orders/useCase/returnOrder.useCase.impl";
import { ProductKind, ProductStatus } from "@/feature/products/types/product.types";
import { describe, expect, it, vi } from "vitest";

const buildOrder = (
  status: (typeof OrderStatus)[keyof typeof OrderStatus],
  overrides: Record<string, unknown> = {},
) => ({
  remoteId: "order-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  orderNumber: "ORD-001",
  orderDate: 1_710_000_000_000,
  customerRemoteId: "contact-1",
  deliveryOrPickupDetails: null,
  notes: null,
  tags: null,
  internalRemarks: null,
  status,
  taxRatePercent: 13,
  subtotalAmount: 100,
  taxAmount: 13,
  discountAmount: 0,
  totalAmount: 113,
  linkedBillingDocumentRemoteId: null,
  linkedLedgerDueEntryRemoteId: null,
  items: [],
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const buildTrackedProduct = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "product-1",
  accountRemoteId: "business-1",
  name: "Rice Bag",
  kind: ProductKind.Item,
  categoryName: "Groceries",
  salePrice: 100,
  costPrice: 80,
  stockQuantity: 10,
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

const buildTrackedOrderLine = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "line-1",
  orderRemoteId: "order-1",
  productRemoteId: "product-1",
  productNameSnapshot: "Rice Bag",
  unitLabelSnapshot: "bag",
  skuOrBarcodeSnapshot: "SKU-1",
  categoryNameSnapshot: "Groceries",
  taxRateLabelSnapshot: "VAT",
  unitPriceSnapshot: 100,
  taxRatePercentSnapshot: 13,
  quantity: 1,
  lineSubtotalAmount: 100,
  lineTaxAmount: 13,
  lineTotalAmount: 113,
  lineOrder: 0,
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

describe("cancelOrderUseCase", () => {
  it("returns current order when already cancelled", async () => {
    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Cancelled),
      })),
      updateOrderStatusByRemoteId: vi.fn(),
    } as any;

    const useCase = createCancelOrderUseCase(repository);
    const result = await useCase.execute({
      remoteId: "order-1",
      lineDispositions: [],
    });

    expect(result.success).toBe(true);
    expect(repository.updateOrderStatusByRemoteId).not.toHaveBeenCalled();
  });

  it("rejects commercially active orders", async () => {
    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Confirmed),
      })),
      updateOrderStatusByRemoteId: vi.fn(),
    } as any;

    const useCase = createCancelOrderUseCase(repository);
    const result = await useCase.execute({
      remoteId: "order-1",
      lineDispositions: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Only draft or pending orders can be cancelled");
    }
    expect(repository.updateOrderStatusByRemoteId).not.toHaveBeenCalled();
  });

  it("rejects draft orders that already have commercial links", async () => {
    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Draft, {
          linkedBillingDocumentRemoteId: "bill-1",
        }),
      })),
      updateOrderStatusByRemoteId: vi.fn(),
    } as any;

    const useCase = createCancelOrderUseCase(repository);
    const result = await useCase.execute({
      remoteId: "order-1",
      lineDispositions: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("already has commercial links");
    }
    expect(repository.updateOrderStatusByRemoteId).not.toHaveBeenCalled();
  });

  it("updates draft order to cancelled", async () => {
    const updatedOrder = buildOrder(OrderStatus.Cancelled);

    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Draft),
      })),
      updateOrderStatusByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: updatedOrder,
      })),
    } as any;

    const useCase = createCancelOrderUseCase(repository);
    const result = await useCase.execute({
      remoteId: "order-1",
      lineDispositions: [],
    });

    expect(result.success).toBe(true);
    expect(repository.updateOrderStatusByRemoteId).toHaveBeenCalledWith(
      "order-1",
      OrderStatus.Cancelled,
    );
  });
});

describe("returnOrderUseCase", () => {
  it("rejects blank remote id", async () => {
    const repository = {
      getOrderByRemoteId: vi.fn(),
      updateOrderStatusByRemoteId: vi.fn(),
    } as any;

    const useCase = createReturnOrderUseCase({
      repository,
      getProductsUseCase: { execute: vi.fn() } as any,
      getInventoryMovementsBySourceUseCase: { execute: vi.fn() } as any,
      saveInventoryMovementsUseCase: { execute: vi.fn() } as any,
      deleteInventoryMovementsByRemoteIdsUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({
      remoteId: "   ",
      lineDispositions: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Order remote id is required");
    }
    expect(repository.getOrderByRemoteId).not.toHaveBeenCalled();
  });

  it("returns current order when already returned", async () => {
    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Returned),
      })),
      updateOrderStatusByRemoteId: vi.fn(),
    } as any;

    const getProductsUseCase = { execute: vi.fn() };
    const getInventoryMovementsBySourceUseCase = { execute: vi.fn() };
    const saveInventoryMovementsUseCase = { execute: vi.fn() };
    const deleteInventoryMovementsByRemoteIdsUseCase = { execute: vi.fn() };

    const useCase = createReturnOrderUseCase({
      repository,
      getProductsUseCase: getProductsUseCase as any,
      getInventoryMovementsBySourceUseCase: getInventoryMovementsBySourceUseCase as any,
      saveInventoryMovementsUseCase: saveInventoryMovementsUseCase as any,
      deleteInventoryMovementsByRemoteIdsUseCase:
        deleteInventoryMovementsByRemoteIdsUseCase as any,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      lineDispositions: [],
    });

    expect(result.success).toBe(true);
    expect(getProductsUseCase.execute).not.toHaveBeenCalled();
    expect(repository.updateOrderStatusByRemoteId).not.toHaveBeenCalled();
  });

  it("rejects non-delivered orders", async () => {
    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Confirmed),
      })),
      updateOrderStatusByRemoteId: vi.fn(),
    } as any;

    const useCase = createReturnOrderUseCase({
      repository,
      getProductsUseCase: { execute: vi.fn() } as any,
      getInventoryMovementsBySourceUseCase: { execute: vi.fn() } as any,
      saveInventoryMovementsUseCase: { execute: vi.fn() } as any,
      deleteInventoryMovementsByRemoteIdsUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      lineDispositions: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Only delivered orders can be returned");
    }
    expect(repository.updateOrderStatusByRemoteId).not.toHaveBeenCalled();
  });

  it("updates delivered service-only order directly to returned", async () => {
    const deliveredServiceOrder = buildOrder(OrderStatus.Delivered, {
      items: [
        buildTrackedOrderLine({
          productRemoteId: "service-1",
          productNameSnapshot: "Consulting",
        }),
      ],
    });

    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: deliveredServiceOrder,
      })),
      updateOrderStatusByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Returned, {
          items: deliveredServiceOrder.items,
        }),
      })),
    } as any;

    const getProductsUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [
          buildTrackedProduct({
            remoteId: "service-1",
            name: "Consulting",
            kind: "service",
          }),
        ],
      })),
    };

    const getInventoryMovementsBySourceUseCase = { execute: vi.fn() };
    const saveInventoryMovementsUseCase = { execute: vi.fn() };
    const deleteInventoryMovementsByRemoteIdsUseCase = { execute: vi.fn() };

    const useCase = createReturnOrderUseCase({
      repository,
      getProductsUseCase: getProductsUseCase as any,
      getInventoryMovementsBySourceUseCase: getInventoryMovementsBySourceUseCase as any,
      saveInventoryMovementsUseCase: saveInventoryMovementsUseCase as any,
      deleteInventoryMovementsByRemoteIdsUseCase:
        deleteInventoryMovementsByRemoteIdsUseCase as any,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      lineDispositions: [],
    });

    expect(result.success).toBe(true);
    expect(repository.updateOrderStatusByRemoteId).toHaveBeenCalledWith(
      "order-1",
      OrderStatus.Returned,
    );
    expect(getInventoryMovementsBySourceUseCase.execute).not.toHaveBeenCalled();
    expect(saveInventoryMovementsUseCase.execute).not.toHaveBeenCalled();
  });

  it("rejects delivered item orders when no delivery movement exists", async () => {
    const deliveredOrder = buildOrder(OrderStatus.Delivered, {
      items: [buildTrackedOrderLine()],
    });

    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: deliveredOrder,
      })),
      updateOrderStatusByRemoteId: vi.fn(),
    } as any;

    const getProductsUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [buildTrackedProduct()],
      })),
    };

    const getInventoryMovementsBySourceUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [],
      })),
    };

    const saveInventoryMovementsUseCase = { execute: vi.fn() };
    const deleteInventoryMovementsByRemoteIdsUseCase = { execute: vi.fn() };

    const useCase = createReturnOrderUseCase({
      repository,
      getProductsUseCase: getProductsUseCase as any,
      getInventoryMovementsBySourceUseCase: getInventoryMovementsBySourceUseCase as any,
      saveInventoryMovementsUseCase: saveInventoryMovementsUseCase as any,
      deleteInventoryMovementsByRemoteIdsUseCase:
        deleteInventoryMovementsByRemoteIdsUseCase as any,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      lineDispositions: [
        {
          lineRemoteId: "line-1",
          sellableQuantity: 1,
          nonSellableQuantity: 0,
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("no posted delivery inventory movement");
    }
    expect(saveInventoryMovementsUseCase.execute).not.toHaveBeenCalled();
    expect(repository.updateOrderStatusByRemoteId).not.toHaveBeenCalled();
  });

  it("records sellable and non-sellable return quantities but restocks only sellable quantity", async () => {
    const deliveredOrder = buildOrder(OrderStatus.Delivered, {
      items: [
        buildTrackedOrderLine({
          quantity: 5,
        }),
      ],
    });

    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: deliveredOrder,
      })),
      updateOrderStatusByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Returned, {
          items: deliveredOrder.items,
        }),
      })),
    } as any;

    const getProductsUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [buildTrackedProduct()],
      })),
    };

    const getInventoryMovementsBySourceUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "delivery-movement-1",
            sourceLineRemoteId: "line-1",
            sourceAction: "delivery_fulfillment",
          },
        ],
      })),
    };

    const saveInventoryMovementsUseCase = {
      execute: vi.fn(async (payloads) => ({
        success: true as const,
        value: payloads,
      })),
    };
    const deleteInventoryMovementsByRemoteIdsUseCase = { execute: vi.fn() };

    const useCase = createReturnOrderUseCase({
      repository,
      getProductsUseCase: getProductsUseCase as any,
      getInventoryMovementsBySourceUseCase:
        getInventoryMovementsBySourceUseCase as any,
      saveInventoryMovementsUseCase: saveInventoryMovementsUseCase as any,
      deleteInventoryMovementsByRemoteIdsUseCase:
        deleteInventoryMovementsByRemoteIdsUseCase as any,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      lineDispositions: [
        {
          lineRemoteId: "line-1",
          sellableQuantity: 3,
          nonSellableQuantity: 2,
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(saveInventoryMovementsUseCase.execute).toHaveBeenCalledTimes(1);
    expect(saveInventoryMovementsUseCase.execute).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: "stock_in",
          quantity: 3,
          sourceAction: "return_restock",
        }),
        expect.objectContaining({
          type: "adjustment",
          quantity: 2,
          reason: "return_non_sellable",
          sourceAction: "return_non_sellable",
        }),
      ]),
    );
  });

  it("rejects return disposition when sellable and non-sellable quantities do not reconcile", async () => {
    const deliveredOrder = buildOrder(OrderStatus.Delivered, {
      items: [
        buildTrackedOrderLine({
          quantity: 5,
        }),
      ],
    });

    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: deliveredOrder,
      })),
      updateOrderStatusByRemoteId: vi.fn(),
    } as any;

    const useCase = createReturnOrderUseCase({
      repository,
      getProductsUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [buildTrackedProduct()],
        })),
      } as any,
      getInventoryMovementsBySourceUseCase: { execute: vi.fn() } as any,
      saveInventoryMovementsUseCase: { execute: vi.fn() } as any,
      deleteInventoryMovementsByRemoteIdsUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      lineDispositions: [
        {
          lineRemoteId: "line-1",
          sellableQuantity: 2,
          nonSellableQuantity: 1,
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("must total 5");
    }
    expect(repository.updateOrderStatusByRemoteId).not.toHaveBeenCalled();
  });

  it("rolls back created return movements if status update fails", async () => {
    const deliveredOrder = buildOrder(OrderStatus.Delivered, {
      items: [buildTrackedOrderLine()],
    });

    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: deliveredOrder,
      })),
      updateOrderStatusByRemoteId: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "DATABASE_ERROR",
          message: "Unable to update order status.",
        },
      })),
    } as any;

    const getProductsUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [buildTrackedProduct()],
      })),
    };

    const getInventoryMovementsBySourceUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "delivery-movement-1",
            accountRemoteId: "business-1",
            productRemoteId: "product-1",
            type: "sale_out",
            quantity: 1,
            unitRate: null,
            reason: null,
            remark: null,
            sourceModule: "orders",
            sourceRemoteId: "order-1",
            sourceLineRemoteId: "line-1",
            sourceAction: "delivery_fulfillment",
            movementAt: 1_710_000_000_000,
            createdAt: 1_710_000_000_000,
            updatedAt: 1_710_000_000_000,
          },
        ],
      })),
    };

    const saveInventoryMovementsUseCase = {
      execute: vi.fn(async (payloads) => ({
        success: true as const,
        value: payloads,
      })),
    };

    const deleteInventoryMovementsByRemoteIdsUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    };

    const useCase = createReturnOrderUseCase({
      repository,
      getProductsUseCase: getProductsUseCase as any,
      getInventoryMovementsBySourceUseCase: getInventoryMovementsBySourceUseCase as any,
      saveInventoryMovementsUseCase: saveInventoryMovementsUseCase as any,
      deleteInventoryMovementsByRemoteIdsUseCase:
        deleteInventoryMovementsByRemoteIdsUseCase as any,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      lineDispositions: [
        {
          lineRemoteId: "line-1",
          sellableQuantity: 1,
          nonSellableQuantity: 0,
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(saveInventoryMovementsUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deleteInventoryMovementsByRemoteIdsUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
