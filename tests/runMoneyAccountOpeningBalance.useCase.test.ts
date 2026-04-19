import { MoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository";
import {
    MoneyAccount,
    MoneyAccountErrorType,
    MoneyAccountType,
    SaveMoneyAccountPayload,
} from "@/feature/accounts/types/moneyAccount.types";
import { createRunMoneyAccountOpeningBalanceWorkflowUseCase } from "@/feature/accounts/workflow/moneyAccountOpeningBalance/useCase/runMoneyAccountOpeningBalance.useCase.impl";
import {
    TransactionDirection,
    TransactionPostingStatus,
    TransactionSourceModule,
    TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { PostMoneyMovementUseCase } from "@/feature/transactions/useCase/postMoneyMovement.useCase";
import { describe, expect, it, vi } from "vitest";

const buildPayload = (
  overrides: Partial<SaveMoneyAccountPayload> = {},
): SaveMoneyAccountPayload => ({
  remoteId: "cash-1",
  ownerUserRemoteId: "user-1",
  scopeAccountRemoteId: "business-1",
  scopeAccountDisplayNameSnapshot: "Main Business",
  name: "Cash Drawer",
  type: MoneyAccountType.Cash,
  currentBalance: 500,
  description: null,
  currencyCode: "NPR",
  isPrimary: true,
  isActive: true,
  ...overrides,
});

const buildAccount = (overrides: Partial<MoneyAccount> = {}): MoneyAccount => ({
  remoteId: "cash-1",
  ownerUserRemoteId: "user-1",
  scopeAccountRemoteId: "business-1",
  name: "Cash Drawer",
  type: MoneyAccountType.Cash,
  currentBalance: 125,
  description: null,
  currencyCode: "NPR",
  isPrimary: true,
  isActive: true,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const createRepository = (
  getMoneyAccountResponses: readonly (MoneyAccount | null)[],
): MoneyAccountRepository => {
  const queuedResponses = [...getMoneyAccountResponses];

  return {
    saveMoneyAccount: vi.fn(async (payload: SaveMoneyAccountPayload) => ({
      success: true as const,
      value: buildAccount({
        remoteId: payload.remoteId,
        ownerUserRemoteId: payload.ownerUserRemoteId,
        scopeAccountRemoteId: payload.scopeAccountRemoteId,
        name: payload.name,
        type: payload.type,
        currentBalance: payload.currentBalance,
        description: payload.description,
        currencyCode: payload.currencyCode,
        isPrimary: payload.isPrimary,
        isActive: payload.isActive,
        createdAt: 1,
        updatedAt: 2,
      }),
    })),
    getMoneyAccountsByScopeAccountRemoteId: vi.fn(),
    getMoneyAccountByRemoteId: vi.fn(async () => {
      const nextResponse = queuedResponses.shift() ?? null;

      return nextResponse
        ? {
            success: true as const,
            value: nextResponse,
          }
        : {
            success: false as const,
            error: {
              type: MoneyAccountErrorType.MoneyAccountNotFound,
              message: "The requested money account was not found.",
            },
          };
    }),
    archiveMoneyAccountByRemoteId: vi.fn(),
  };
};

const createPostMoneyMovementUseCase = (): PostMoneyMovementUseCase => ({
  execute: vi.fn(async (payload) => ({
    success: true as const,
    value: {
      ...payload,
      settlementMoneyAccountRemoteId:
        payload.settlementMoneyAccountRemoteId ?? null,
      settlementMoneyAccountDisplayNameSnapshot:
        payload.settlementMoneyAccountDisplayNameSnapshot ?? null,
      sourceModule: payload.sourceModule ?? TransactionSourceModule.Manual,
      sourceRemoteId: payload.sourceRemoteId ?? null,
      sourceAction: payload.sourceAction ?? null,
      idempotencyKey: payload.idempotencyKey ?? null,
      postingStatus: payload.postingStatus ?? TransactionPostingStatus.Posted,
      contactRemoteId: payload.contactRemoteId ?? null,
      createdAt: 1,
      updatedAt: 1,
    },
  })),
});

describe("runMoneyAccountOpeningBalance workflow", () => {
  it("creates the money account with zero stored balance and posts the opening balance transaction", async () => {
    const repository = createRepository([
      null,
      buildAccount({
        currentBalance: 750,
      }),
    ]);
    const postMoneyMovementUseCase = createPostMoneyMovementUseCase();

    const useCase = createRunMoneyAccountOpeningBalanceWorkflowUseCase({
      moneyAccountRepository: repository,
      postMoneyMovementUseCase,
    });

    const result = await useCase.execute(
      buildPayload({
        currentBalance: 750,
      }),
    );

    expect(result.success).toBe(true);
    expect(repository.saveMoneyAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: "cash-1",
        currentBalance: 0,
      }),
    );
    expect(postMoneyMovementUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        accountDisplayNameSnapshot: "Main Business",
        amount: 750,
        categoryLabel: "Opening Balance",
        direction: TransactionDirection.In,
        settlementMoneyAccountRemoteId: "cash-1",
        sourceModule: TransactionSourceModule.MoneyAccounts,
        sourceAction: "opening_balance",
        transactionType: TransactionType.Income,
      }),
    );
  });

  it("returns after account save when opening balance is zero", async () => {
    const repository = createRepository([null]);
    const postMoneyMovementUseCase = createPostMoneyMovementUseCase();

    const useCase = createRunMoneyAccountOpeningBalanceWorkflowUseCase({
      moneyAccountRepository: repository,
      postMoneyMovementUseCase,
    });

    const result = await useCase.execute(
      buildPayload({
        currentBalance: 0,
      }),
    );

    expect(result.success).toBe(true);
    expect(repository.saveMoneyAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        currentBalance: 0,
      }),
    );
    expect(postMoneyMovementUseCase.execute).not.toHaveBeenCalled();
  });

  it("recovers a zero-balance existing account by posting the opening balance idempotently", async () => {
    const repository = createRepository([
      buildAccount({
        currentBalance: 0,
      }),
      buildAccount({
        currentBalance: 750,
      }),
    ]);
    const postMoneyMovementUseCase = createPostMoneyMovementUseCase();

    const useCase = createRunMoneyAccountOpeningBalanceWorkflowUseCase({
      moneyAccountRepository: repository,
      postMoneyMovementUseCase,
    });

    const result = await useCase.execute(
      buildPayload({
        currentBalance: 750,
      }),
    );

    expect(result.success).toBe(true);
    expect(repository.saveMoneyAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: "cash-1",
        currentBalance: 0,
      }),
    );
    expect(postMoneyMovementUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        accountDisplayNameSnapshot: "Main Business",
        amount: 750,
        categoryLabel: "Opening Balance",
        direction: TransactionDirection.In,
        settlementMoneyAccountRemoteId: "cash-1",
        sourceModule: TransactionSourceModule.MoneyAccounts,
        sourceAction: "opening_balance",
        transactionType: TransactionType.Income,
        idempotencyKey: "money-account:cash-1:opening-balance",
      }),
    );

    if (result.success) {
      expect(result.value.currentBalance).toBe(750);
    }
  });

  it("reuses the same opening-balance idempotency key across repeated recovery retries", async () => {
    const repository = createRepository([
      buildAccount({
        currentBalance: 0,
      }),
      buildAccount({
        currentBalance: 0,
      }),
      buildAccount({
        currentBalance: 0,
      }),
      buildAccount({
        currentBalance: 0,
      }),
    ]);
    const postMoneyMovementUseCase = createPostMoneyMovementUseCase();

    const useCase = createRunMoneyAccountOpeningBalanceWorkflowUseCase({
      moneyAccountRepository: repository,
      postMoneyMovementUseCase,
    });

    await useCase.execute(
      buildPayload({
        currentBalance: 750,
      }),
    );
    await useCase.execute(
      buildPayload({
        currentBalance: 750,
      }),
    );

    const postCalls = vi.mocked(postMoneyMovementUseCase.execute).mock.calls;
    expect(postCalls).toHaveLength(2);
    expect(postCalls[0][0]).toEqual(
      expect.objectContaining({
        idempotencyKey: "money-account:cash-1:opening-balance",
      }),
    );
    expect(postCalls[1][0]).toEqual(
      expect.objectContaining({
        idempotencyKey: "money-account:cash-1:opening-balance",
      }),
    );
  });

  it("keeps account upsert scoped to the same remoteId across create and recovery retries", async () => {
    const repository = createRepository([
      null,
      buildAccount({
        currentBalance: 0,
      }),
      buildAccount({
        currentBalance: 0,
      }),
      buildAccount({
        currentBalance: 0,
      }),
    ]);
    const postMoneyMovementUseCase = createPostMoneyMovementUseCase();

    const useCase = createRunMoneyAccountOpeningBalanceWorkflowUseCase({
      moneyAccountRepository: repository,
      postMoneyMovementUseCase,
    });

    await useCase.execute(
      buildPayload({
        remoteId: "cash-1",
        currentBalance: 750,
      }),
    );
    await useCase.execute(
      buildPayload({
        remoteId: "cash-1",
        currentBalance: 750,
      }),
    );

    const saveCalls = vi.mocked(repository.saveMoneyAccount).mock.calls;
    expect(saveCalls.length).toBeGreaterThan(0);
    for (const [payload] of saveCalls) {
      expect(payload).toEqual(
        expect.objectContaining({
          remoteId: "cash-1",
        }),
      );
    }
  });

  it("rejects non-recoverable existing accounts", async () => {
    const repository = createRepository([
      buildAccount({
        currentBalance: 125,
      }),
    ]);
    const postMoneyMovementUseCase = createPostMoneyMovementUseCase();

    const useCase = createRunMoneyAccountOpeningBalanceWorkflowUseCase({
      moneyAccountRepository: repository,
      postMoneyMovementUseCase,
    });

    const result = await useCase.execute(buildPayload());

    expect(result.success).toBe(false);
    expect(repository.saveMoneyAccount).not.toHaveBeenCalled();
    expect(postMoneyMovementUseCase.execute).not.toHaveBeenCalled();
  });
});
