import { MoneyAccountModel } from "@/feature/accounts/data/dataSource/db/moneyAccount.model";
import { MoneyAccountBalanceDatasource } from "@/feature/transactions/data/dataSource/moneyAccountBalance.datasource";
import { MoneyPostingDatasource } from "@/feature/transactions/data/dataSource/moneyPosting.datasource";
import { TransactionModel } from "@/feature/transactions/data/dataSource/db/transaction.model";
import {
  SaveTransactionPayload,
  TransactionDirection,
  TransactionPostingStatus,
  TransactionSourceModule,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { createMoneyPostingWorkflowRepository } from "@/feature/transactions/workflow/moneyPosting/repository/moneyPostingWorkflow.repository.impl";
import {
  MoneyPostingWorkflowPlan,
} from "@/feature/transactions/workflow/moneyPosting/types/moneyPostingWorkflow.types";
import { describe, expect, it, vi } from "vitest";

const buildPayload = (): SaveTransactionPayload => ({
  remoteId: "txn-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "business-1",
  accountDisplayNameSnapshot: "Business Account",
  transactionType: TransactionType.Income,
  direction: TransactionDirection.In,
  title: "POS Payment",
  amount: 100,
  currencyCode: "NPR",
  categoryLabel: "POS",
  note: null,
  happenedAt: 1710000000000,
  settlementMoneyAccountRemoteId: "money-1",
  settlementMoneyAccountDisplayNameSnapshot: "Cash",
  sourceModule: TransactionSourceModule.Pos,
  sourceRemoteId: "pos-sale-1",
  sourceAction: "checkout_payment",
  idempotencyKey: "pos-sale-1-payment-1",
  postingStatus: TransactionPostingStatus.Posted,
  contactRemoteId: null,
});

const buildCreatePlan = (): MoneyPostingWorkflowPlan => ({
  mode: "create",
  normalizedPayload: buildPayload(),
  existingTransaction: null,
  transactionMutation: {
    kind: "create",
    postingStatus: TransactionPostingStatus.Posted,
  },
  balanceAdjustments: [
    {
      moneyAccountRemoteId: "money-1",
      delta: 100,
    },
  ],
});

const buildTransactionModel = () =>
  ({
    id: "transaction-model-1",
  }) as unknown as TransactionModel;

const buildMoneyAccountModel = () =>
  ({
    id: "money-account-model-1",
  }) as unknown as MoneyAccountModel;

const createHarness = (params: {
  activeMoneyAccount: MoneyAccountModel | null;
}) => {
  const transactionModel = buildTransactionModel();

  const transactionDatasource: MoneyPostingDatasource = {
    getTransactionByRemoteId: vi.fn(async () => ({
      success: true as const,
      value: null,
    })),
    getActiveTransactionByIdempotencyKey: vi.fn(async () => ({
      success: true as const,
      value: null,
    })),
    runInTransaction: vi.fn(async (operation) => {
      try {
        const value = await operation();
        return {
          success: true as const,
          value,
        };
      } catch (error) {
        return {
          success: false as const,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    }),
    createTransaction: vi.fn(async () => ({
      success: true as const,
      value: transactionModel,
    })),
    updateTransaction: vi.fn(async () => ({
      success: true as const,
      value: transactionModel,
    })),
    markTransactionVoided: vi.fn(async () => ({
      success: true as const,
      value: transactionModel,
    })),
  };

  const moneyAccountBalanceDatasource: MoneyAccountBalanceDatasource = {
    getActiveMoneyAccountByRemoteId: vi.fn(async () => ({
      success: true as const,
      value: params.activeMoneyAccount,
    })),
    applyMoneyAccountBalanceDelta: vi.fn(async () => ({
      success: true as const,
      value: params.activeMoneyAccount ?? buildMoneyAccountModel(),
    })),
  };

  const repository = createMoneyPostingWorkflowRepository({
    transactionDatasource,
    moneyAccountBalanceDatasource,
  });

  return {
    repository,
    transactionDatasource,
    moneyAccountBalanceDatasource,
  };
};

describe("moneyPostingWorkflow.repository", () => {
  it("applies balance delta when the settlement money account is active", async () => {
    const activeMoneyAccount = buildMoneyAccountModel();
    const {
      repository,
      moneyAccountBalanceDatasource,
    } = createHarness({
      activeMoneyAccount,
    });

    const result = await repository.applyPostMoneyMovementPlan(buildCreatePlan());

    expect(result.success).toBe(true);
    expect(
      moneyAccountBalanceDatasource.getActiveMoneyAccountByRemoteId,
    ).toHaveBeenCalledWith("money-1");
    expect(
      moneyAccountBalanceDatasource.applyMoneyAccountBalanceDelta,
    ).toHaveBeenCalledWith(activeMoneyAccount, 100);
  });

  it("fails posting when the settlement money account is not active", async () => {
    const {
      repository,
      moneyAccountBalanceDatasource,
    } = createHarness({
      activeMoneyAccount: null,
    });

    const result = await repository.applyPostMoneyMovementPlan(buildCreatePlan());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Settlement money account not found.");
    }

    expect(
      moneyAccountBalanceDatasource.getActiveMoneyAccountByRemoteId,
    ).toHaveBeenCalledWith("money-1");
    expect(
      moneyAccountBalanceDatasource.applyMoneyAccountBalanceDelta,
    ).not.toHaveBeenCalled();
  });
});
