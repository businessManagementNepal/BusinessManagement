import { createRunOrderRefundPostingWorkflowUseCase } from "@/workflow/orderRefundPosting/useCase/runOrderRefundPostingWorkflow.useCase.impl";
import { buildOrderLedgerDueEntryRemoteId } from "@/feature/orders/utils/orderCommercialEffects.util";
import { describe, expect, it, vi } from "vitest";

vi.mock("expo-crypto", () => ({
  randomUUID: () => "refund-ledger-entry-1",
}));

const baseInput = {
  orderRemoteId: "order-1",
  orderNumber: "ORD-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  accountDisplayNameSnapshot: "Main Business",
  currencyCode: "NPR",
  amount: 50,
  happenedAt: 1_710_000_000_000,
  settlementMoneyAccountRemoteId: "cash-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash Drawer",
  note: "refund",
};

const dueEntryRemoteId = buildOrderLedgerDueEntryRemoteId("order-1");

const buildDeps = (overrides: Partial<any> = {}) => ({
  getBillingOverviewUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: { documents: [] },
    })),
  },
  getLedgerEntriesUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: [
        {
          remoteId: dueEntryRemoteId,
          balanceDirection: "receive",
        },
      ],
    })),
  },
  transactionRepository: {
    getPostedOrderLinkedTransactionsByOrderRemoteIds: vi.fn(async () => ({
      success: true as const,
      value: [],
    })),
  },
  saveBillingDocumentUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  },
  deleteBillingDocumentUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  },
  saveLedgerEntryWithSettlementUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: true,
    })),
  },
  ensureOrderBillingAndDueLinksUseCase: {
    execute: vi.fn(async () => ({
      success: true as const,
      value: {
        order: {
          remoteId: "order-1",
          orderNumber: "ORD-1",
          accountRemoteId: "business-1",
        },
        contact: {
          remoteId: "contact-1",
          fullName: "Customer",
          phoneNumber: null,
        },
        billingDocumentRemoteId: "bill-1",
        ledgerDueEntryRemoteId: dueEntryRemoteId,
      },
    })),
  },
  ...overrides,
});

describe("runOrderRefundPostingWorkflow", () => {
  it("uses strict linked transaction read and succeeds", async () => {
    const deps = buildDeps({
      getBillingOverviewUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            documents: [
              {
                remoteId: "bill-1",
                sourceModule: "orders",
                sourceRemoteId: "order-1",
                paidAmount: 100,
                outstandingAmount: 0,
              },
            ],
          },
        })),
      },
      transactionRepository: {
        getPostedOrderLinkedTransactionsByOrderRemoteIds: vi.fn(async () => ({
          success: true as const,
          value: [
            {
              sourceModule: "orders",
              sourceRemoteId: "order-1",
              sourceAction: "payment",
              postingStatus: "posted",
              amount: 100,
            },
          ],
        })),
      },
    });

    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);
    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(true);
    expect(
      deps.transactionRepository.getPostedOrderLinkedTransactionsByOrderRemoteIds,
    ).toHaveBeenCalledWith({
      accountRemoteId: "business-1",
      orderRemoteIds: ["order-1"],
    });
  });

  it("returns failure when strict transaction read fails", async () => {
    const deps = buildDeps({
      transactionRepository: {
        getPostedOrderLinkedTransactionsByOrderRemoteIds: vi.fn(async () => ({
          success: false as const,
          error: { message: "query failed" },
        })),
      },
    });

    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);
    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(false);
  });

  it("rolls back created refund document when settlement write fails", async () => {
    const deps = buildDeps({
      getBillingOverviewUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            documents: [
              {
                remoteId: "bill-1",
                sourceModule: "orders",
                sourceRemoteId: "order-1",
                paidAmount: 100,
                outstandingAmount: 0,
              },
            ],
          },
        })),
      },
      transactionRepository: {
        getPostedOrderLinkedTransactionsByOrderRemoteIds: vi.fn(async () => ({
          success: true as const,
          value: [
            {
              sourceModule: "orders",
              sourceRemoteId: "order-1",
              sourceAction: "payment",
              postingStatus: "posted",
              amount: 100,
            },
          ],
        })),
      },
      saveLedgerEntryWithSettlementUseCase: {
        execute: vi.fn(async () => ({
          success: false as const,
          error: { message: "settlement failed" },
        })),
      },
    });

    const useCase = createRunOrderRefundPostingWorkflowUseCase(deps as any);
    const result = await useCase.execute(baseInput);

    expect(result.success).toBe(false);
    expect(deps.deleteBillingDocumentUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
