import {
  BudgetScopedRemoteIdInput,
  BudgetOperationResult,
  BudgetPlanResult,
  BudgetPlansResult,
  SaveBudgetPlanPayload,
} from "@/feature/budget/types/budget.types";

export interface BudgetRepository {
  getBudgetPlansByAccountRemoteId(accountRemoteId: string): Promise<BudgetPlansResult>;
  getBudgetPlanByRemoteId(input: BudgetScopedRemoteIdInput): Promise<BudgetPlanResult>;
  createBudgetPlan(payload: SaveBudgetPlanPayload): Promise<BudgetPlanResult>;
  updateBudgetPlan(payload: SaveBudgetPlanPayload): Promise<BudgetPlanResult>;
  deleteBudgetPlanByRemoteId(
    input: BudgetScopedRemoteIdInput,
  ): Promise<BudgetOperationResult>;
}
