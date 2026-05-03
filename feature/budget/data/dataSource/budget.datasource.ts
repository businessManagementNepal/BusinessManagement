import {
  BudgetScopedRemoteIdInput,
  SaveBudgetPlanPayload,
} from "@/feature/budget/types/budget.types";
import { Result } from "@/shared/types/result.types";
import { BudgetPlanModel } from "./db/budgetPlan.model";

export interface BudgetDatasource {
  saveBudgetPlan(payload: SaveBudgetPlanPayload): Promise<Result<BudgetPlanModel>>;
  getBudgetPlansByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<BudgetPlanModel[]>>;
  getBudgetPlanByRemoteId(
    input: BudgetScopedRemoteIdInput,
  ): Promise<Result<BudgetPlanModel | null>>;
  deleteBudgetPlanByRemoteId(
    input: BudgetScopedRemoteIdInput,
  ): Promise<Result<boolean>>;
}
