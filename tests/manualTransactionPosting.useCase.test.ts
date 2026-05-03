import { describe, expect, it, vi } from "vitest";
import { createAddTransactionUseCase } from "@/feature/transactions/useCase/addTransaction.useCase.impl";
import { createDeleteTransactionUseCase } from "@/feature/transactions/useCase/deleteTransaction.useCase.impl";
import { createUpdateTransactionUseCase } from "@/feature/transactions/useCase/updateTransaction.useCase.impl";
import { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import {
  TransactionDirection,
  TransactionPostingStatus,
  TransactionSourceModule,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";

describe("manual transaction posting use cases", () => {
  it("AddTransactionUseCase still routes through canonical money posting behavior", async () => {
    const canonicalPostMoneyMovementUseCase = {
      execute: vi.fn(async (payload: any) => ({
        success: true as const,
        value: {
          ...payload,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    };
    const useCase = createAddTransactionUseCase(
      canonicalPostMoneyMovementUseCase,
    );

    const result = await useCase.execute({
      remoteId: " txn-canonical-add ",
      ownerUserRemoteId: " user-1 ",
      accountRemoteId: " business-1 ",
      accountDisplayNameSnapshot: " Main Business ",
      transactionType: TransactionType.Income,
      direction: TransactionDirection.In,
      title: " Canonical Add ",
      amount: 200,
      currencyCode: "NPR",
      categoryLabel: " Sales ",
      note: " note ",
      happenedAt: 1_710_000_000_000,
      settlementMoneyAccountRemoteId: " cash-1 ",
      settlementMoneyAccountDisplayNameSnapshot: " Cash Box ",
    });

    expect(result.success).toBe(true);
    expect(canonicalPostMoneyMovementUseCase.execute).toHaveBeenCalledTimes(1);
    expect(canonicalPostMoneyMovementUseCase.execute).toHaveBeenCalledWith({
      remoteId: "txn-canonical-add",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      transactionType: TransactionType.Income,
      direction: TransactionDirection.In,
      title: "Canonical Add",
      amount: 200,
      currencyCode: "NPR",
      categoryLabel: "Sales",
      categoryRemoteId: null,
      categoryNameSnapshot: null,
      note: "note",
      happenedAt: 1_710_000_000_000,
      settlementMoneyAccountRemoteId: "cash-1",
      settlementMoneyAccountDisplayNameSnapshot: "Cash Box",
      sourceModule: TransactionSourceModule.Manual,
      sourceRemoteId: null,
      sourceAction: null,
      idempotencyKey: null,
      postingStatus: TransactionPostingStatus.Posted,
    });
  });

  it("UpdateTransactionUseCase still routes through canonical money posting behavior", async () => {
    const canonicalPostMoneyMovementUseCase = {
      execute: vi.fn(async (payload: any) => ({
        success: true as const,
        value: {
          ...payload,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    };
    const useCase = createUpdateTransactionUseCase(
      canonicalPostMoneyMovementUseCase,
    );

    const result = await useCase.execute({
      remoteId: " txn-canonical-update ",
      ownerUserRemoteId: " user-1 ",
      accountRemoteId: " business-1 ",
      accountDisplayNameSnapshot: " Main Business ",
      transactionType: TransactionType.Expense,
      direction: TransactionDirection.Out,
      title: " Canonical Update ",
      amount: 120,
      currencyCode: "NPR",
      categoryLabel: " Supplies ",
      note: " update note ",
      happenedAt: 1_710_000_000_100,
      settlementMoneyAccountRemoteId: " cash-1 ",
      settlementMoneyAccountDisplayNameSnapshot: " Cash Box ",
    });

    expect(result.success).toBe(true);
    expect(canonicalPostMoneyMovementUseCase.execute).toHaveBeenCalledTimes(1);
    expect(canonicalPostMoneyMovementUseCase.execute).toHaveBeenCalledWith({
      remoteId: "txn-canonical-update",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      transactionType: TransactionType.Expense,
      direction: TransactionDirection.Out,
      title: "Canonical Update",
      amount: 120,
      currencyCode: "NPR",
      categoryLabel: "Supplies",
      categoryRemoteId: null,
      categoryNameSnapshot: null,
      note: "update note",
      happenedAt: 1_710_000_000_100,
      settlementMoneyAccountRemoteId: "cash-1",
      settlementMoneyAccountDisplayNameSnapshot: "Cash Box",
      sourceModule: TransactionSourceModule.Manual,
      sourceRemoteId: null,
      sourceAction: null,
      idempotencyKey: null,
      postingStatus: TransactionPostingStatus.Posted,
    });
  });

  it("routes manual create through shared posting with normalized manual defaults", async () => {
    const postBusinessTransactionUseCase = {
      execute: vi.fn(async (payload: any) => ({
        success: true as const,
        value: {
          ...payload,
          sourceModule: payload.sourceModule ?? TransactionSourceModule.Manual,
          postingStatus:
            payload.postingStatus ?? TransactionPostingStatus.Posted,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    };

    const useCase = createAddTransactionUseCase(
      postBusinessTransactionUseCase as unknown as PostBusinessTransactionUseCase,
    );

    const result = await useCase.execute({
      remoteId: " txn-1 ",
      ownerUserRemoteId: " user-1 ",
      accountRemoteId: " business-1 ",
      accountDisplayNameSnapshot: " Main Business ",
      transactionType: TransactionType.Income,
      direction: TransactionDirection.In,
      title: " Salary ",
      amount: 500,
      currencyCode: "NPR",
      categoryLabel: " Income ",
      note: " monthly ",
      happenedAt: 1_710_000_000_000,
      settlementMoneyAccountRemoteId: " cash-1 ",
      settlementMoneyAccountDisplayNameSnapshot: " Cash Box ",
    });

    expect(result.success).toBe(true);
    expect(postBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(postBusinessTransactionUseCase.execute).toHaveBeenCalledWith({
      remoteId: "txn-1",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      transactionType: TransactionType.Income,
      direction: TransactionDirection.In,
      title: "Salary",
      amount: 500,
      currencyCode: "NPR",
      categoryLabel: "Income",
      categoryRemoteId: null,
      categoryNameSnapshot: null,
      note: "monthly",
      happenedAt: 1_710_000_000_000,
      settlementMoneyAccountRemoteId: "cash-1",
      settlementMoneyAccountDisplayNameSnapshot: "Cash Box",
      sourceModule: TransactionSourceModule.Manual,
      sourceRemoteId: null,
      sourceAction: null,
      idempotencyKey: null,
      postingStatus: TransactionPostingStatus.Posted,
    });
  });

  it("routes manual update through shared posting without forcing a legacy blank money account link", async () => {
    const postBusinessTransactionUseCase = {
      execute: vi.fn(async (payload: any) => ({
        success: true as const,
        value: {
          ...payload,
          sourceModule: payload.sourceModule ?? TransactionSourceModule.Manual,
          postingStatus:
            payload.postingStatus ?? TransactionPostingStatus.Posted,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    };

    const useCase = createUpdateTransactionUseCase(
      postBusinessTransactionUseCase as unknown as PostBusinessTransactionUseCase,
    );

    const result = await useCase.execute({
      remoteId: "txn-legacy-1",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "business-1",
      accountDisplayNameSnapshot: "Main Business",
      transactionType: TransactionType.Expense,
      direction: TransactionDirection.Out,
      title: "Legacy Rent",
      amount: 250,
      currencyCode: "NPR",
      categoryLabel: null,
      note: null,
      happenedAt: 1_710_000_100_000,
      settlementMoneyAccountRemoteId: null,
      settlementMoneyAccountDisplayNameSnapshot: null,
    });

    expect(result.success).toBe(true);
    expect(postBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(postBusinessTransactionUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: "txn-legacy-1",
        settlementMoneyAccountRemoteId: null,
        settlementMoneyAccountDisplayNameSnapshot: null,
        sourceModule: TransactionSourceModule.Manual,
        postingStatus: TransactionPostingStatus.Posted,
      }),
    );
  });

  it("routes manual delete through shared business delete semantics", async () => {
    const deleteBusinessTransactionUseCase = {
      execute: vi.fn(async (_remoteId: string) => ({
        success: true as const,
        value: true,
      })),
    };

    const useCase = createDeleteTransactionUseCase(
      deleteBusinessTransactionUseCase as unknown as DeleteBusinessTransactionUseCase,
    );

    const result = await useCase.execute(" txn-delete-1 ");

    expect(result.success).toBe(true);
    expect(deleteBusinessTransactionUseCase.execute).toHaveBeenCalledTimes(1);
    expect(deleteBusinessTransactionUseCase.execute).toHaveBeenCalledWith(
      "txn-delete-1",
    );
  });
});
