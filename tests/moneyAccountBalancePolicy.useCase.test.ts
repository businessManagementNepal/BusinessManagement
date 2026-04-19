import { MoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository";
import {
    MoneyAccount,
    MoneyAccountErrorType,
    MoneyAccountType,
    SaveMoneyAccountPayload,
} from "@/feature/accounts/types/moneyAccount.types";
import { createSaveMoneyAccountUseCase } from "@/feature/accounts/useCase/saveMoneyAccount.useCase.impl";
import { RunMoneyAccountOpeningBalanceWorkflowUseCase } from "@/feature/accounts/workflow/moneyAccountOpeningBalance/useCase/runMoneyAccountOpeningBalance.useCase";
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

const createOpeningBalanceWorkflow =
  (): RunMoneyAccountOpeningBalanceWorkflowUseCase => ({
    execute: vi.fn(async (payload) => ({
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
        updatedAt: 1,
      }),
    })),
  });

describe("money account save use case", () => {
  it("delegates new money-account creation into the opening-balance workflow", async () => {
    const repository = createRepository([null]);
    const runMoneyAccountOpeningBalanceWorkflowUseCase =
      createOpeningBalanceWorkflow();

    const useCase = createSaveMoneyAccountUseCase({
      repository,
      runMoneyAccountOpeningBalanceWorkflowUseCase,
    });

    const result = await useCase.execute(
      buildPayload({
        currentBalance: 750,
      }),
    );

    expect(result.success).toBe(true);
    expect(
      runMoneyAccountOpeningBalanceWorkflowUseCase.execute,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: "cash-1",
        ownerUserRemoteId: "user-1",
        scopeAccountRemoteId: "business-1",
        currentBalance: 750,
      }),
    );
    expect(repository.saveMoneyAccount).not.toHaveBeenCalled();
  });

  it("delegates recoverable pending opening-balance accounts back into the opening-balance workflow", async () => {
    const repository = createRepository([
      buildAccount({
        currentBalance: 0,
      }),
    ]);
    const runMoneyAccountOpeningBalanceWorkflowUseCase =
      createOpeningBalanceWorkflow();

    const useCase = createSaveMoneyAccountUseCase({
      repository,
      runMoneyAccountOpeningBalanceWorkflowUseCase,
    });

    const result = await useCase.execute(
      buildPayload({
        currentBalance: 750,
      }),
    );

    expect(result.success).toBe(true);
    expect(
      runMoneyAccountOpeningBalanceWorkflowUseCase.execute,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: "cash-1",
        ownerUserRemoteId: "user-1",
        scopeAccountRemoteId: "business-1",
        currentBalance: 750,
      }),
    );
    expect(repository.saveMoneyAccount).not.toHaveBeenCalled();
  });

  it("retries the same create attempt on the same remoteId without direct duplicate account save", async () => {
    const repository = createRepository([
      null,
      buildAccount({
        currentBalance: 0,
      }),
    ]);
    const runMoneyAccountOpeningBalanceWorkflowUseCase =
      createOpeningBalanceWorkflow();

    const useCase = createSaveMoneyAccountUseCase({
      repository,
      runMoneyAccountOpeningBalanceWorkflowUseCase,
    });

    const retryPayload = buildPayload({
      remoteId: "cash-1",
      currentBalance: 750,
    });

    const firstResult = await useCase.execute(retryPayload);
    const secondResult = await useCase.execute(retryPayload);

    expect(firstResult.success).toBe(true);
    expect(secondResult.success).toBe(true);
    expect(
      runMoneyAccountOpeningBalanceWorkflowUseCase.execute,
    ).toHaveBeenCalledTimes(2);
    expect(
      runMoneyAccountOpeningBalanceWorkflowUseCase.execute,
    ).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        remoteId: "cash-1",
        currentBalance: 750,
      }),
    );
    expect(
      runMoneyAccountOpeningBalanceWorkflowUseCase.execute,
    ).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        remoteId: "cash-1",
        currentBalance: 750,
      }),
    );
    expect(repository.saveMoneyAccount).not.toHaveBeenCalled();
  });

  it("preserves existing current balance when account details are edited", async () => {
    const repository = createRepository([
      buildAccount({
        currentBalance: 125,
      }),
    ]);
    const runMoneyAccountOpeningBalanceWorkflowUseCase =
      createOpeningBalanceWorkflow();

    const useCase = createSaveMoneyAccountUseCase({
      repository,
      runMoneyAccountOpeningBalanceWorkflowUseCase,
    });

    const result = await useCase.execute(
      buildPayload({
        name: "Front Counter Cash",
        currentBalance: 999,
      }),
    );

    expect(result.success).toBe(true);
    expect(repository.saveMoneyAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Front Counter Cash",
        currentBalance: 125,
      }),
    );
    expect(
      runMoneyAccountOpeningBalanceWorkflowUseCase.execute,
    ).not.toHaveBeenCalled();
  });
});
