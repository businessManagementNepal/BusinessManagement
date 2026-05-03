import {
  BudgetPlanResult,
  BudgetScopedRemoteIdInput,
} from "@/feature/budget/types/budget.types";

export interface GetBudgetPlanByRemoteIdUseCase {
  execute(input: BudgetScopedRemoteIdInput): Promise<BudgetPlanResult>;
}
