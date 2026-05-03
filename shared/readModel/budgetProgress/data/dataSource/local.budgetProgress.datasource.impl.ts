import { BudgetPlanModel } from "@/feature/budget/data/dataSource/db/budgetPlan.model";
import { TransactionModel } from "@/feature/transactions/data/dataSource/db/transaction.model";
import { TransactionPostingStatus, TransactionType } from "@/feature/transactions/types/transaction.entity.types";
import { BudgetProgressQuery } from "@/shared/readModel/budgetProgress/types/budgetProgress.query.types";
import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import {
  BudgetProgressDatasource,
  BudgetProgressRawDataset,
} from "./budgetProgress.datasource";

const BUDGET_PLANS_TABLE = "budget_plans";
const TRANSACTIONS_TABLE = "transactions";

export const createLocalBudgetProgressDatasource = (
  database: Database,
): BudgetProgressDatasource => ({
  async getDataset(
    query: BudgetProgressQuery,
  ): Promise<Result<BudgetProgressRawDataset>> {
    try {
      const budgetPlansCollection =
        database.get<BudgetPlanModel>(BUDGET_PLANS_TABLE);
      const transactionsCollection =
        database.get<TransactionModel>(TRANSACTIONS_TABLE);

      const [budgetPlans, transactions] = await Promise.all([
        budgetPlansCollection
          .query(
            Q.where("owner_user_remote_id", query.ownerUserRemoteId),
            Q.where("account_remote_id", query.accountRemoteId),
            Q.where("deleted_at", Q.eq(null)),
            Q.sortBy("budget_month", Q.desc),
            Q.sortBy("category_name_snapshot", Q.asc),
          )
          .fetch(),
        transactionsCollection
          .query(
            Q.where("owner_user_remote_id", query.ownerUserRemoteId),
            Q.where("account_remote_id", query.accountRemoteId),
            Q.where(
              "transaction_type",
              Q.oneOf([TransactionType.Expense, TransactionType.Refund]),
            ),
            Q.where("posting_status", TransactionPostingStatus.Posted),
            Q.where("deleted_at", Q.eq(null)),
            Q.sortBy("happened_at", Q.desc),
          )
          .fetch(),
      ]);

      return {
        success: true,
        value: {
          budgetPlans,
          transactions,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
