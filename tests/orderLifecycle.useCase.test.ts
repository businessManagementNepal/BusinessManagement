import { createCancelOrderUseCase } from "@/feature/orders/useCase/cancelOrder.useCase.impl";
import { createReturnOrderUseCase } from "@/feature/orders/useCase/returnOrder.useCase.impl";
import { OrderStatus } from "@/feature/orders/types/order.types";
import { RunOrderReturnProcessingWorkflowUseCase } from "@/workflow/orderReturnProcessing/useCase/runOrderReturnProcessingWorkflow.useCase";
import { describe, expect, it, vi } from "vitest";

const buildOrder = (status: (typeof OrderStatus)[keyof typeof OrderStatus]) => ({
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
  taxRatePercent: 0,
  subtotalAmount: 100,
  taxAmount: 0,
  discountAmount: 0,
  totalAmount: 100,
  linkedBillingDocumentRemoteId: null,
  linkedLedgerDueEntryRemoteId: null,
  items: [],
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
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
    const result = await useCase.execute("order-1");

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
    const result = await useCase.execute("order-1");

    expect(result.success).toBe(false);
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
    const result = await useCase.execute("order-1");

    expect(result.success).toBe(true);
    expect(repository.updateOrderStatusByRemoteId).toHaveBeenCalledWith(
      "order-1",
      OrderStatus.Cancelled,
    );
  });
});

describe("returnOrderUseCase", () => {
  it("forwards remote id to return workflow", async () => {
    const runOrderReturnProcessingWorkflowUseCase: RunOrderReturnProcessingWorkflowUseCase =
      {
        execute: vi.fn(async () => ({
          success: true as const,
          value: buildOrder(OrderStatus.Returned),
        })),
      };

    const useCase = createReturnOrderUseCase({
      runOrderReturnProcessingWorkflowUseCase,
    });

    const result = await useCase.execute("order-2");

    expect(result.success).toBe(true);
    expect(
      runOrderReturnProcessingWorkflowUseCase.execute,
    ).toHaveBeenCalledWith({
      orderRemoteId: "order-2",
    });
  });
});
