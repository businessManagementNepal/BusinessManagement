import {
  BudgetDatabaseError,
  BudgetError,
  BudgetUnknownError,
  BudgetValidationError,
} from "@/feature/budget/types/budget.types";
import { BudgetProgressDatasource } from "@/shared/readModel/budgetProgress/data/dataSource/budgetProgress.datasource";
import { BudgetProgressRepository } from "@/shared/readModel/budgetProgress/data/repository/budgetProgress.repository";
import { BudgetProgressQuery } from "@/shared/readModel/budgetProgress/types/budgetProgress.query.types";
import {
  BudgetProgressItem,
  BudgetProgressReadModel,
} from "@/shared/readModel/budgetProgress/types/budgetProgress.readModel.types";
import { TransactionType } from "@/feature/transactions/types/transaction.entity.types";

const normalizeCategoryLabel = (
  value: string | null | undefined,
): string | null => {
  const normalizedValue = value?.trim().toLowerCase() ?? "";
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const getBudgetMonthForTimestamp = (value: number): string => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getCurrentBudgetMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getTransactionBudgetImpactAmount = (
  transaction: import("@/feature/transactions/data/dataSource/db/transaction.model").TransactionModel,
): number => {
  if (transaction.transactionType === TransactionType.Refund) {
    return -transaction.amount;
  }

  return transaction.amount;
};

const calculateSpentAmount = ({
  budgetMonth,
  categoryRemoteId,
  categoryNameSnapshot,
  transactions,
}: {
  budgetMonth: string;
  categoryRemoteId: string;
  categoryNameSnapshot: string;
  transactions: readonly import("@/feature/transactions/data/dataSource/db/transaction.model").TransactionModel[];
}): number => {
  const normalizedBudgetCategoryLabel =
    normalizeCategoryLabel(categoryNameSnapshot);

  const netSpentAmount = transactions.reduce((sum, transaction) => {
    if (getBudgetMonthForTimestamp(transaction.happenedAt) !== budgetMonth) {
      return sum;
    }

    if (
      transaction.categoryRemoteId &&
      transaction.categoryRemoteId === categoryRemoteId
    ) {
      return sum + getTransactionBudgetImpactAmount(transaction);
    }

    if (transaction.categoryRemoteId === null) {
      const normalizedTransactionCategoryLabel = normalizeCategoryLabel(
        transaction.categoryLabel,
      );

      if (
        normalizedTransactionCategoryLabel &&
        normalizedTransactionCategoryLabel === normalizedBudgetCategoryLabel
      ) {
        return sum + getTransactionBudgetImpactAmount(transaction);
      }
    }

    return sum;
  }, 0);

  return Math.max(0, netSpentAmount);
};

const buildBudgetProgressItem = ({
  budgetPlan,
  transactions,
}: {
  budgetPlan: import("@/feature/budget/data/dataSource/db/budgetPlan.model").BudgetPlanModel;
  transactions: readonly import("@/feature/transactions/data/dataSource/db/transaction.model").TransactionModel[];
}): BudgetProgressItem => {
  const spentAmount = calculateSpentAmount({
    budgetMonth: budgetPlan.budgetMonth,
    categoryRemoteId: budgetPlan.categoryRemoteId,
    categoryNameSnapshot: budgetPlan.categoryNameSnapshot,
    transactions,
  });
  const remainingAmount = budgetPlan.plannedAmount - spentAmount;
  const isOverspent = remainingAmount < 0;
  const progressPercent =
    budgetPlan.plannedAmount <= 0
      ? 0
      : Math.max(
          0,
          Math.min(100, (spentAmount / budgetPlan.plannedAmount) * 100),
        );

  return {
    budgetRemoteId: budgetPlan.remoteId,
    accountRemoteId: budgetPlan.accountRemoteId,
    budgetMonth: budgetPlan.budgetMonth,
    categoryRemoteId: budgetPlan.categoryRemoteId,
    categoryNameSnapshot: budgetPlan.categoryNameSnapshot,
    plannedAmount: budgetPlan.plannedAmount,
    spentAmount,
    remainingAmount,
    progressPercent,
    isOverspent,
    currencyCode: budgetPlan.currencyCode,
    note: budgetPlan.note,
  };
};

const buildBudgetProgressReadModel = ({
  budgetPlans,
  transactions,
}: {
  budgetPlans: readonly import("@/feature/budget/data/dataSource/db/budgetPlan.model").BudgetPlanModel[];
  transactions: readonly import("@/feature/transactions/data/dataSource/db/transaction.model").TransactionModel[];
}): BudgetProgressReadModel => {
  const items = budgetPlans.map((budgetPlan) =>
    buildBudgetProgressItem({
      budgetPlan,
      transactions,
    }),
  );
  const currentBudgetMonth = getCurrentBudgetMonth();
  const currentMonthItems = items.filter(
    (item) => item.budgetMonth === currentBudgetMonth,
  );
  const currentMonthPlannedAmount = currentMonthItems.reduce(
    (sum, item) => sum + item.plannedAmount,
    0,
  );
  const currentMonthSpentAmount = currentMonthItems.reduce(
    (sum, item) => sum + item.spentAmount,
    0,
  );

  return {
    items,
    summary: {
      currentMonthPlannedAmount,
      currentMonthSpentAmount,
      currentMonthRemainingAmount:
        currentMonthPlannedAmount - currentMonthSpentAmount,
      hasOverspentBudget: currentMonthItems.some((item) => item.isOverspent),
    },
  };
};

const mapDatasourceError = (error: Error): BudgetError => {
  const normalizedMessage = error.message.trim().toLowerCase();

  if (normalizedMessage.includes("required") || normalizedMessage.includes("invalid")) {
    return BudgetValidationError(error.message);
  }

  if (normalizedMessage.includes("database") || normalizedMessage.includes("table")) {
    return BudgetDatabaseError;
  }

  return {
    ...BudgetUnknownError,
    message: error.message || BudgetUnknownError.message,
  };
};

export const createBudgetProgressRepository = (
  datasource: BudgetProgressDatasource,
): BudgetProgressRepository => ({
  async getBudgetProgressReadModel(query: BudgetProgressQuery) {
    const result = await datasource.getDataset(query);

    if (!result.success) {
      return {
        success: false,
        error: mapDatasourceError(result.error),
      };
    }

    return {
      success: true,
      value: buildBudgetProgressReadModel(result.value),
    };
  },
});
