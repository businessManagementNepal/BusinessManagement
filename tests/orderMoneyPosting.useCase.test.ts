import { describe, expect, it, vi } from "vitest";
import { createRecordOrderPaymentUseCase } from "@/feature/orders/useCase/recordOrderPayment.useCase.impl";
import { createRefundOrderUseCase } from "@/feature/orders/useCase/refundOrder.useCase.impl";
import { RunOrderPaymentPostingWorkflowUseCase } from "@/workflow/orderPaymentPosting/useCase/runOrderPaymentPostingWorkflow.useCase";
import { RunOrderRefundPostingWorkflowUseCase } from "@/workflow/orderRefundPosting/useCase/runOrderRefundPostingWorkflow.useCase";

describe("order payment/refund use-case delegates", () => {
  it("forwards payment payload to the payment-posting workflow", async () => {
    const runOrderPaymentPostingWorkflowUseCase: RunOrderPaymentPostingWorkflowUseCase =
      {
      execute: vi.fn(async () => ({ success: true as const, value: true })),
      };

    const useCase = createRecordOrderPaymentUseCase({
      runOrderPaymentPostingWorkflowUseCase,
    });

    const input = {
      orderRemoteId: "order-1",
      orderNumber: "ORD-001",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      currencyCode: "NPR",
      amount: 500,
      happenedAt: 1_710_000_000_000,
      settlementMoneyAccountRemoteId: "cash-1",
      settlementMoneyAccountDisplayNameSnapshot: "Cash Drawer",
      note: "paid in full",
    };

    const result = await useCase.execute(input);

    expect(result.success).toBe(true);
    expect(runOrderPaymentPostingWorkflowUseCase.execute).toHaveBeenCalledWith(
      input,
    );
  });

  it("forwards refund payload to the refund-posting workflow", async () => {
    const runOrderRefundPostingWorkflowUseCase: RunOrderRefundPostingWorkflowUseCase =
      {
      execute: vi.fn(async () => ({ success: true as const, value: true })),
      };

    const useCase = createRefundOrderUseCase({
      runOrderRefundPostingWorkflowUseCase,
    });

    const input = {
      orderRemoteId: "order-2",
      orderNumber: "ORD-002",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      currencyCode: "NPR",
      amount: 250,
      happenedAt: 1_710_000_100_000,
      settlementMoneyAccountRemoteId: "bank-1",
      settlementMoneyAccountDisplayNameSnapshot: "Main Bank",
      note: "customer refund",
    };

    const result = await useCase.execute(input);

    expect(result.success).toBe(true);
    expect(runOrderRefundPostingWorkflowUseCase.execute).toHaveBeenCalledWith(
      input,
    );
  });

  it("returns workflow failures unchanged", async () => {
    const error = {
      type: "VALIDATION_ERROR" as const,
      message: "Money account is required.",
    };
    const runOrderPaymentPostingWorkflowUseCase: RunOrderPaymentPostingWorkflowUseCase =
      {
      execute: vi.fn(async () => ({ success: false as const, error })),
      };

    const useCase = createRecordOrderPaymentUseCase({
      runOrderPaymentPostingWorkflowUseCase,
    });

    const result = await useCase.execute({
      orderRemoteId: "order-1",
      orderNumber: "ORD-001",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      currencyCode: "NPR",
      amount: 500,
      happenedAt: 1_710_000_000_000,
      settlementMoneyAccountRemoteId: "   ",
      settlementMoneyAccountDisplayNameSnapshot: "Cash Drawer",
      note: null,
    });

    expect(result).toEqual({ success: false, error });
    expect(runOrderPaymentPostingWorkflowUseCase.execute).toHaveBeenCalledTimes(
      1,
    );
  });
});
