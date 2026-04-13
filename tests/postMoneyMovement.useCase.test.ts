import { MoneyPostingRepository } from "@/feature/transactions/data/repository/moneyPosting.repository";
import {
    TransactionDirection,
    TransactionPostingStatus,
    TransactionSourceModule,
    TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { createPostMoneyMovementUseCase } from "@/feature/transactions/useCase/postMoneyMovement.useCase.impl";
import { describe, expect, it, vi } from "vitest";

describe("postMoneyMovement.useCase", () => {
  it("normalizes payloads and posts through the money posting repository", async () => {
    const repository: MoneyPostingRepository = {
      postMoneyMovement: vi.fn(async (payload) => ({
        success: true as const,
        value: {
          ...payload,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
      deleteMoneyMovementByRemoteId: vi.fn(),
    };
    const useCase = createPostMoneyMovementUseCase(repository);

    const result = await useCase.execute({
      remoteId: " txn-1 ",
      ownerUserRemoteId: " user-1 ",
      accountRemoteId: " account-1 ",
      accountDisplayNameSnapshot: " Main Business ",
      transactionType: TransactionType.Income,
      direction: TransactionDirection.In,
      title: " Sale ",
      amount: 100,
      currencyCode: " NPR ",
      categoryLabel: " POS ",
      note: " cash ",
      happenedAt: 1_710_000_000_000,
      settlementMoneyAccountRemoteId: " cash-1 ",
      settlementMoneyAccountDisplayNameSnapshot: " Cash Drawer ",
    });

    expect(result.success).toBe(true);
    expect(repository.postMoneyMovement).toHaveBeenCalledWith({
      remoteId: "txn-1",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "account-1",
      accountDisplayNameSnapshot: "Main Business",
      transactionType: TransactionType.Income,
      direction: TransactionDirection.In,
      title: "Sale",
      amount: 100,
      currencyCode: "NPR",
      categoryLabel: "POS",
      note: "cash",
      happenedAt: 1_710_000_000_000,
      postingStatus: TransactionPostingStatus.Posted,
      contactRemoteId: null,
      settlementMoneyAccountRemoteId: "cash-1",
      settlementMoneyAccountDisplayNameSnapshot: "Cash Drawer",
      sourceModule: TransactionSourceModule.Manual,
      sourceRemoteId: null,
      sourceAction: null,
      idempotencyKey: null,
    });
  });
});
