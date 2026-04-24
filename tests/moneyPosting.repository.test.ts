import { createMoneyPostingRepository } from "@/feature/transactions/data/repository/moneyPosting.repository.impl";
import {
  TransactionDirection,
  TransactionPostingStatus,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { TransactionErrorType } from "@/feature/transactions/types/transaction.error.types";
import { describe, expect, it, vi } from "vitest";

const buildTransactionModel = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "txn-1",
  ownerUserRemoteId: "owner-1",
  accountRemoteId: "account-1",
  accountDisplayNameSnapshot: "Main Account",
  transactionType: TransactionType.Income,
  direction: TransactionDirection.In,
  title: "POS Sale",
  amount: 100,
  currencyCode: "NPR",
  categoryLabel: "POS",
  note: null,
  happenedAt: 1710000000000,
  postingStatus: TransactionPostingStatus.Posted,
  contactRemoteId: null,
  settlementMoneyAccountRemoteId: "cash-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash",
  sourceModule: "pos",
  sourceRemoteId: "sale-1",
  sourceAction: "checkout",
  idempotencyKey: "idem-1",
  createdAt: new Date(1710000000000),
  updatedAt: new Date(1710000001000),
  ...overrides,
});

describe("moneyPosting.repository", () => {
  it("postMoneyMovement calls injected workflow and maps model to domain transaction", async () => {
    const workflowUseCase = {
      postMoneyMovement: vi.fn(async () => ({
        success: true as const,
        value: buildTransactionModel(),
      })),
      deleteMoneyMovementByRemoteId: vi.fn(),
    };

    const repository = createMoneyPostingRepository(workflowUseCase as never);

    const result = await repository.postMoneyMovement({
      remoteId: "txn-1",
      ownerUserRemoteId: "owner-1",
      accountRemoteId: "account-1",
      accountDisplayNameSnapshot: "Main Account",
      transactionType: TransactionType.Income,
      direction: TransactionDirection.In,
      title: "POS Sale",
      amount: 100,
      currencyCode: "NPR",
      categoryLabel: "POS",
      note: null,
      happenedAt: 1710000000000,
      settlementMoneyAccountRemoteId: "cash-1",
      settlementMoneyAccountDisplayNameSnapshot: "Cash",
      sourceModule: "pos",
      sourceRemoteId: "sale-1",
      sourceAction: "checkout",
      idempotencyKey: "idem-1",
      postingStatus: TransactionPostingStatus.Posted,
      contactRemoteId: null,
    });

    expect(result.success).toBe(true);
    expect(workflowUseCase.postMoneyMovement).toHaveBeenCalledOnce();

    if (result.success) {
      expect(result.value.remoteId).toBe("txn-1");
      expect(result.value.amount).toBe(100);
      expect(result.value.createdAt).toBe(1710000000000);
      expect(result.value.updatedAt).toBe(1710000001000);
    }
  });

  it("postMoneyMovement maps workflow failure to transaction error", async () => {
    const workflowUseCase = {
      postMoneyMovement: vi.fn(async () => ({
        success: false as const,
        error: new Error("database timeout"),
      })),
      deleteMoneyMovementByRemoteId: vi.fn(),
    };

    const repository = createMoneyPostingRepository(workflowUseCase as never);

    const result = await repository.postMoneyMovement({
      remoteId: "txn-1",
      ownerUserRemoteId: "owner-1",
      accountRemoteId: "account-1",
      accountDisplayNameSnapshot: "Main Account",
      transactionType: TransactionType.Income,
      direction: TransactionDirection.In,
      title: "POS Sale",
      amount: 100,
      currencyCode: "NPR",
      categoryLabel: "POS",
      note: null,
      happenedAt: 1710000000000,
    });

    expect(result).toEqual({
      success: false,
      error: expect.objectContaining({
        type: TransactionErrorType.DatabaseError,
        message: "database timeout",
      }),
    });
  });

  it("deleteMoneyMovementByRemoteId calls injected workflow", async () => {
    const workflowUseCase = {
      postMoneyMovement: vi.fn(),
      deleteMoneyMovementByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    };

    const repository = createMoneyPostingRepository(workflowUseCase as never);

    const result = await repository.deleteMoneyMovementByRemoteId("txn-1");

    expect(result).toEqual({
      success: true,
      value: true,
    });
    expect(workflowUseCase.deleteMoneyMovementByRemoteId).toHaveBeenCalledWith(
      "txn-1",
    );
  });

  it("deleteMoneyMovementByRemoteId maps workflow failure to transaction error", async () => {
    const workflowUseCase = {
      postMoneyMovement: vi.fn(),
      deleteMoneyMovementByRemoteId: vi.fn(async () => ({
        success: false as const,
        error: new Error("schema mismatch"),
      })),
    };

    const repository = createMoneyPostingRepository(workflowUseCase as never);

    const result = await repository.deleteMoneyMovementByRemoteId("txn-1");

    expect(result).toEqual({
      success: false,
      error: expect.objectContaining({
        type: TransactionErrorType.DatabaseError,
        message: "schema mismatch",
      }),
    });
  });
});
