import { BudgetPlanModel } from "@/feature/budget/data/dataSource/db/budgetPlan.model";
import { TransactionModel } from "@/feature/transactions/data/dataSource/db/transaction.model";
import { BudgetProgressQuery } from "@/shared/readModel/budgetProgress/types/budgetProgress.query.types";
import { Result } from "@/shared/types/result.types";

export type BudgetProgressRawDataset = {
  budgetPlans: readonly BudgetPlanModel[];
  transactions: readonly TransactionModel[];
};

export interface BudgetProgressDatasource {
  getDataset(
    query: BudgetProgressQuery,
  ): Promise<Result<BudgetProgressRawDataset>>;
}
