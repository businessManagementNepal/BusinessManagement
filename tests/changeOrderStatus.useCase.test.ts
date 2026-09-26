import { OrderStatus } from "@/feature/orders/types/order.types";
import { createChangeOrderStatusUseCase } from "@/feature/orders/useCase/changeOrderStatus.useCase.impl";
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

describe("changeOrderStatusUseCase", () => {
  it("rejects returned status outside the disposition flow", async () => {
    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Delivered),
      })),
      updateOrderStatusByRemoteId: vi.fn(),
    } as any;

    const returnOrderUseCase = {
      execute: vi.fn(),
    };

    const useCase = createChangeOrderStatusUseCase({
      repository,
      ensureOrderBillingAndDueLinksUseCase: { execute: vi.fn() } as any,
      ensureOrderDeliveredInventoryMovementsUseCase: { execute: vi.fn() } as any,
      returnOrderUseCase: returnOrderUseCase as any,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      status: OrderStatus.Returned,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("return disposition flow");
    }
    expect(returnOrderUseCase.execute).not.toHaveBeenCalled();
    expect(repository.updateOrderStatusByRemoteId).not.toHaveBeenCalled();
  });

  it("does not trigger commercial linking for non-financial status", async () => {
    const updatedOrder = buildOrder(OrderStatus.Pending);

    const repository = {
      getOrderByRemoteId: vi
        .fn()
        .mockResolvedValueOnce({
          success: true as const,
          value: buildOrder(OrderStatus.Draft),
        })
        .mockResolvedValueOnce({
          success: true as const,
          value: updatedOrder,
        }),
      updateOrderStatusByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: updatedOrder,
      })),
    } as any;

    const ensureOrderBillingAndDueLinksUseCase = {
      execute: vi.fn(),
    };

    const ensureOrderDeliveredInventoryMovementsUseCase = {
      execute: vi.fn(),
    };

    const useCase = createChangeOrderStatusUseCase({
      repository,
      ensureOrderBillingAndDueLinksUseCase:
        ensureOrderBillingAndDueLinksUseCase as any,
      ensureOrderDeliveredInventoryMovementsUseCase:
        ensureOrderDeliveredInventoryMovementsUseCase as any,
      returnOrderUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      status: OrderStatus.Pending,
    });

    expect(result.success).toBe(true);
    expect(ensureOrderBillingAndDueLinksUseCase.execute).not.toHaveBeenCalled();
    expect(ensureOrderDeliveredInventoryMovementsUseCase.execute).not.toHaveBeenCalled();
  });

  it("runs commercial linking exactly once for financial status", async () => {
    const confirmedOrder = buildOrder(OrderStatus.Confirmed);

    const repository = {
      getOrderByRemoteId: vi
        .fn()
        .mockResolvedValueOnce({
          success: true as const,
          value: buildOrder(OrderStatus.Pending),
        })
        .mockResolvedValueOnce({
          success: true as const,
          value: confirmedOrder,
        }),
      updateOrderStatusByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: confirmedOrder,
      })),
    } as any;

    const ensureOrderBillingAndDueLinksUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          order: confirmedOrder,
          contact: null,
          billingDocumentRemoteId: "bill-1",
          ledgerDueEntryRemoteId: "due-1",
        },
      })),
    };

    const useCase = createChangeOrderStatusUseCase({
      repository,
      ensureOrderBillingAndDueLinksUseCase:
        ensureOrderBillingAndDueLinksUseCase as any,
      ensureOrderDeliveredInventoryMovementsUseCase: { execute: vi.fn() } as any,
      returnOrderUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      status: OrderStatus.Confirmed,
    });

    expect(result.success).toBe(true);
    expect(ensureOrderBillingAndDueLinksUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it("reverts status if commercial linking fails", async () => {
    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Pending),
      })),
      updateOrderStatusByRemoteId: vi
        .fn()
        .mockResolvedValueOnce({
          success: true as const,
          value: buildOrder(OrderStatus.Confirmed),
        })
        .mockResolvedValueOnce({
          success: true as const,
          value: buildOrder(OrderStatus.Pending),
        }),
    } as any;

    const ensureOrderBillingAndDueLinksUseCase = {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "VALIDATION_ERROR",
          message: "Commercial linking failed.",
        },
      })),
    };

    const useCase = createChangeOrderStatusUseCase({
      repository,
      ensureOrderBillingAndDueLinksUseCase:
        ensureOrderBillingAndDueLinksUseCase as any,
      ensureOrderDeliveredInventoryMovementsUseCase: { execute: vi.fn() } as any,
      returnOrderUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      status: OrderStatus.Confirmed,
    });

    expect(result.success).toBe(false);
    expect(repository.updateOrderStatusByRemoteId).toHaveBeenNthCalledWith(
      2,
      "order-1",
      OrderStatus.Pending,
    );
  });

  it("runs delivered inventory only after commercial linking succeeds", async () => {
    const deliveredOrder = buildOrder(OrderStatus.Delivered);

    const repository = {
      getOrderByRemoteId: vi
        .fn()
        .mockResolvedValueOnce({
          success: true as const,
          value: buildOrder(OrderStatus.Shipped),
        })
        .mockResolvedValueOnce({
          success: true as const,
          value: deliveredOrder,
        }),
      updateOrderStatusByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: deliveredOrder,
      })),
    } as any;

    const executionOrder: string[] = [];

    const ensureOrderBillingAndDueLinksUseCase = {
      execute: vi.fn(async () => {
        executionOrder.push("commercial");
        return {
          success: true as const,
          value: {
            order: deliveredOrder,
            contact: null,
            billingDocumentRemoteId: "bill-1",
            ledgerDueEntryRemoteId: "due-1",
          },
        };
      }),
    };

    const ensureOrderDeliveredInventoryMovementsUseCase = {
      execute: vi.fn(async () => {
        executionOrder.push("inventory");
        return {
          success: true as const,
          value: { createdMovementRemoteIds: [] },
        };
      }),
    };

    const useCase = createChangeOrderStatusUseCase({
      repository,
      ensureOrderBillingAndDueLinksUseCase:
        ensureOrderBillingAndDueLinksUseCase as any,
      ensureOrderDeliveredInventoryMovementsUseCase:
        ensureOrderDeliveredInventoryMovementsUseCase as any,
      returnOrderUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      status: OrderStatus.Delivered,
    });

    expect(result.success).toBe(true);
    expect(executionOrder).toEqual(["commercial", "inventory"]);
  });

  it("reverts status if delivered inventory posting fails", async () => {
    const repository = {
      getOrderByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: buildOrder(OrderStatus.Shipped),
      })),
      updateOrderStatusByRemoteId: vi
        .fn()
        .mockResolvedValueOnce({
          success: true as const,
          value: buildOrder(OrderStatus.Delivered),
        })
        .mockResolvedValueOnce({
          success: true as const,
          value: buildOrder(OrderStatus.Shipped),
        }),
    } as any;

    const ensureOrderBillingAndDueLinksUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          order: buildOrder(OrderStatus.Delivered),
          contact: null,
          billingDocumentRemoteId: "bill-1",
          ledgerDueEntryRemoteId: "due-1",
        },
      })),
    };

    const ensureOrderDeliveredInventoryMovementsUseCase = {
      execute: vi.fn(async () => ({
        success: false as const,
        error: {
          type: "VALIDATION_ERROR",
          message: "Inventory posting failed.",
        },
      })),
    };

    const useCase = createChangeOrderStatusUseCase({
      repository,
      ensureOrderBillingAndDueLinksUseCase:
        ensureOrderBillingAndDueLinksUseCase as any,
      ensureOrderDeliveredInventoryMovementsUseCase:
        ensureOrderDeliveredInventoryMovementsUseCase as any,
      returnOrderUseCase: { execute: vi.fn() } as any,
    });

    const result = await useCase.execute({
      remoteId: "order-1",
      status: OrderStatus.Delivered,
    });

    expect(result.success).toBe(false);
    expect(repository.updateOrderStatusByRemoteId).toHaveBeenNthCalledWith(
      2,
      "order-1",
      OrderStatus.Shipped,
    );
  });
});
