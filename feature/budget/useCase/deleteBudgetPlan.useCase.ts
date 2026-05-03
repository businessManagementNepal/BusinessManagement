import {
  BudgetOperationResult,
  BudgetScopedRemoteIdInput,
} from "@/feature/budget/types/budget.types";

export interface DeleteBudgetPlanUseCase {
  execute(input: BudgetScopedRemoteIdInput): Promise<BudgetOperationResult>;
}
