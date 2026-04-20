import { createRunOrderLegacyTransactionLinkRepairWorkflowUseCase } from "@/workflow/orderLegacyTransactionLinkRepair/useCase/runOrderLegacyTransactionLinkRepairWorkflow.useCase.impl";
import { describe, expect, it, vi } from "vitest";

const baseInput = {
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
};

const baseTransaction = {
  remoteId: "txn-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  accountDisplayNameSnapshot: "Main",
  transactionType: "income",
  direction: "in",
  title: "Order Payment ORD-1",
  amount: 100,
  currencyCode: "NPR",
  categoryLabel: null,
  note: null,
  happenedAt: 1_710_000_000_000,
  settlementMoneyAccountRemoteId: "cash-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash",
  sourceRemoteId: null,
  sourceAction: null,
  idempotencyKey: null,
  postingStatus: "posted",
  contactRemoteId: null,
};

describe("runOrderLegacyTransactionLinkRepairWorkflow", () => {
  it("repairs conservatively when there is a unique order-number match", async () => {
    const deps = {
      getOrdersUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [{ remoteId: "order-1", orderNumber: "ORD-1" }],
        })),
      },
      transactionRepository: {
        getLegacyUnlinkedOrderTransactionsForRepair: vi.fn(async () => ({
          success: true as const,
          value: [baseTransaction],
        })),
      },
      postBusinessTransactionUseCase: {
        execute: vi.fn(async () => ({ success: true as const, value: true })),
      },
    };

    const useCase =
      createRunOrderLegacyTransactionLinkRepairWorkflowUseCase(deps as any);
    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.repairedCount).toBe(1);
      expect(result.value.ambiguousCount).toBe(0);
    }
    expect(deps.postBusinessTransactionUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: "txn-1",
        sourceModule: "orders",
        sourceRemoteId: "order-1",
        sourceAction: "payment",
      }),
    );
  });

  it("is idempotent when no legacy unlinked rows remain", async () => {
    const deps = {
      getOrdersUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [{ remoteId: "order-1", orderNumber: "ORD-1" }],
        })),
      },
      transactionRepository: {
        getLegacyUnlinkedOrderTransactionsForRepair: vi
          .fn()
          .mockResolvedValueOnce({
            success: true as const,
            value: [baseTransaction],
          })
          .mockResolvedValueOnce({
            success: true as const,
            value: [],
          }),
      },
      postBusinessTransactionUseCase: {
        execute: vi.fn(async () => ({ success: true as const, value: true })),
      },
    };

    const useCase =
      createRunOrderLegacyTransactionLinkRepairWorkflowUseCase(deps as any);

    const first = await useCase.execute(baseInput);
    const second = await useCase.execute(baseInput);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(deps.postBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it("skips ambiguous matches and does not relink them", async () => {
    const deps = {
      getOrdersUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: [
            { remoteId: "order-1", orderNumber: "ORD-1" },
            { remoteId: "order-2", orderNumber: "ORD-1" },
          ],
        })),
      },
      transactionRepository: {
        getLegacyUnlinkedOrderTransactionsForRepair: vi.fn(async () => ({
          success: true as const,
          value: [baseTransaction],
        })),
      },
      postBusinessTransactionUseCase: {
        execute: vi.fn(async () => ({ success: true as const, value: true })),
      },
    };

    const useCase =
      createRunOrderLegacyTransactionLinkRepairWorkflowUseCase(deps as any);
    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.repairedCount).toBe(0);
      expect(result.value.ambiguousCount).toBe(1);
    }
    expect(deps.postBusinessTransactionUseCase.execute).not.toHaveBeenCalled();
  });
});
