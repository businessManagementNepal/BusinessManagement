import { createSaveMoneyAccountUseCase } from "@/feature/accounts/useCase/saveMoneyAccount.useCase.impl";
import {
  type MoneyAccount,
  MoneyAccountErrorType,
  MoneyAccountType,
  type SaveMoneyAccountPayload,
} from "@/feature/accounts/types/moneyAccount.types";
import { createRunMoneyAccountOpeningBalanceWorkflowUseCase } from "@/feature/accounts/workflow/moneyAccountOpeningBalance/useCase/runMoneyAccountOpeningBalance.useCase.impl";
import {
  TransactionDirection,
  TransactionPostingStatus,
  TransactionSourceModule,
  TransactionType,
  type SaveTransactionPayload,
} from "@/feature/transactions/types/transaction.entity.types";
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
  currentBalance: 0,
  description: null,
  currencyCode: "NPR",
  isPrimary: true,
  isActive: true,
  createdAt: 1_710_000_000_000,
  updatedAt: 1_710_000_000_000,
  ...overrides,
});

const createHarness = (params?: {
  initialAccounts?: readonly MoneyAccount[];
  failOpeningPostOnce?: boolean;
}) => {
  const accounts = new Map<string, MoneyAccount>(
    (params?.initialAccounts ?? []).map((account) => [account.remoteId, account]),
  );
  const saveCalls: SaveMoneyAccountPayload[] = [];
  const postCalls: SaveTransactionPayload[] = [];
  let failOpeningPostOnce = params?.failOpeningPostOnce ?? false;

  const repository = {
    saveMoneyAccount: vi.fn(async (payload: SaveMoneyAccountPayload) => {
      saveCalls.push(payload);
      const existing = accounts.get(payload.remoteId);
      const next: MoneyAccount = buildAccount({
        ...(existing ?? {}),
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
        updatedAt: (existing?.updatedAt ?? 1_710_000_000_000) + 1,
      });
      accounts.set(next.remoteId, next);
      return {
        success: true as const,
        value: next,
      };
    }),
    getMoneyAccountsByScopeAccountRemoteId: vi.fn(),
    getMoneyAccountByRemoteId: vi.fn(async (remoteId: string) => {
      const account = accounts.get(remoteId) ?? null;
      if (!account) {
        return {
          success: false as const,
          error: {
            type: MoneyAccountErrorType.MoneyAccountNotFound,
            message: "The requested money account was not found.",
          },
        };
      }

      return {
        success: true as const,
        value: account,
      };
    }),
    archiveMoneyAccountByRemoteId: vi.fn(),
  };

  const postMoneyMovementUseCase = {
    execute: vi.fn(async (payload: SaveTransactionPayload) => {
      postCalls.push(payload);

      if (failOpeningPostOnce) {
        failOpeningPostOnce = false;
        return {
          success: false as const,
          error: {
            type: "UNKNOWN_ERROR" as const,
            message: "Opening balance posting failed.",
          },
        };
      }

      const account = accounts.get(payload.settlementMoneyAccountRemoteId ?? "");
      if (!account) {
        return {
          success: false as const,
          error: {
            type: "UNKNOWN_ERROR" as const,
            message: "Settlement account missing.",
          },
        };
      }

      const delta =
        payload.direction === TransactionDirection.In
          ? payload.amount
          : -payload.amount;
      accounts.set(account.remoteId, {
        ...account,
        currentBalance: Number((account.currentBalance + delta).toFixed(2)),
        updatedAt: account.updatedAt + 1,
      });

      return {
        success: true as const,
        value: {
          ...payload,
          categoryRemoteId: payload.categoryRemoteId ?? null,
          categoryNameSnapshot: payload.categoryNameSnapshot ?? null,
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
          createdAt: 1_710_000_000_000,
          updatedAt: 1_710_000_000_000,
        },
      };
    }),
  };

  const openingBalanceWorkflow = createRunMoneyAccountOpeningBalanceWorkflowUseCase({
    moneyAccountRepository: repository,
    postMoneyMovementUseCase,
  });

  const saveMoneyAccountUseCase = createSaveMoneyAccountUseCase({
    repository,
    runMoneyAccountOpeningBalanceWorkflowUseCase: openingBalanceWorkflow,
  });

  return {
    accounts,
    saveCalls,
    postCalls,
    saveMoneyAccountUseCase,
  };
};

describe("moneyAccountOpeningBalance.integration", () => {
  it("creates a new money account with opening balance and posts the opening balance movement", async () => {
    const harness = createHarness();

    const result = await harness.saveMoneyAccountUseCase.execute(
      buildPayload({
        currentBalance: 500,
      }),
    );

    expect(result.success).toBe(true);
    expect(harness.saveCalls[0]).toEqual(
      expect.objectContaining({
        remoteId: "cash-1",
        currentBalance: 0,
      }),
    );
    expect(harness.accounts.get("cash-1")?.currentBalance).toBe(500);
    expect(harness.postCalls).toHaveLength(1);
    expect(harness.postCalls[0]).toEqual(
      expect.objectContaining({
        amount: 500,
        transactionType: TransactionType.Income,
        direction: TransactionDirection.In,
        settlementMoneyAccountRemoteId: "cash-1",
        sourceModule: TransactionSourceModule.MoneyAccounts,
        sourceAction: "opening_balance",
        categoryLabel: "Opening Balance",
      }),
    );
  });

  it("preserves the existing current balance when editing account details", async () => {
    const harness = createHarness({
      initialAccounts: [
        buildAccount({
          currentBalance: 500,
        }),
      ],
    });

    const result = await harness.saveMoneyAccountUseCase.execute(
      buildPayload({
        name: "Front Counter Cash",
        currentBalance: 9999,
      }),
    );

    expect(result.success).toBe(true);
    expect(harness.saveCalls).toHaveLength(1);
    expect(harness.saveCalls[0]).toEqual(
      expect.objectContaining({
        name: "Front Counter Cash",
        currentBalance: 500,
      }),
    );
    expect(harness.accounts.get("cash-1")?.currentBalance).toBe(500);
    expect(harness.postCalls).toHaveLength(0);
  });

  it("keeps a failed opening-balance account recoverable and succeeds on retry", async () => {
    const harness = createHarness({
      failOpeningPostOnce: true,
    });
    const payload = buildPayload({
      currentBalance: 500,
    });

    const first = await harness.saveMoneyAccountUseCase.execute(payload);
    expect(first.success).toBe(false);
    expect(harness.accounts.get("cash-1")?.currentBalance).toBe(0);

    const second = await harness.saveMoneyAccountUseCase.execute(payload);

    expect(harness.postCalls).toHaveLength(2);
    expect(harness.postCalls[0]?.idempotencyKey).toBe(
      "money-account:cash-1:opening-balance",
    );
    expect(harness.postCalls[1]?.idempotencyKey).toBe(
      "money-account:cash-1:opening-balance",
    );

    expect(second.success).toBe(true);
    expect(harness.accounts.get("cash-1")?.currentBalance).toBe(500);
  });
});
