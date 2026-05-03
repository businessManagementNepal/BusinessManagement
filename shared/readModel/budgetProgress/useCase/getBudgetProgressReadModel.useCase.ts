import { BudgetError } from "@/feature/budget/types/budget.types";
import { BudgetProgressQuery } from "@/shared/readModel/budgetProgress/types/budgetProgress.query.types";
import { BudgetProgressReadModel } from "@/shared/readModel/budgetProgress/types/budgetProgress.readModel.types";
import { Result } from "@/shared/types/result.types";

export interface GetBudgetProgressReadModelUseCase {
  execute(
    query: BudgetProgressQuery,
  ): Promise<Result<BudgetProgressReadModel, BudgetError>>;
}
