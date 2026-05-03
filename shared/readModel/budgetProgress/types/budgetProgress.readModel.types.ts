export type BudgetProgressItem = {
  budgetRemoteId: string;
  accountRemoteId: string;
  budgetMonth: string;
  categoryRemoteId: string;
  categoryNameSnapshot: string;
  plannedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progressPercent: number;
  isOverspent: boolean;
  currencyCode: string | null;
  note: string | null;
};

export type BudgetProgressSummary = {
  currentMonthPlannedAmount: number;
  currentMonthSpentAmount: number;
  currentMonthRemainingAmount: number;
  hasOverspentBudget: boolean;
};

export type BudgetProgressReadModel = {
  items: readonly BudgetProgressItem[];
  summary: BudgetProgressSummary;
};
