import { BudgetRepository } from "@/feature/budget/data/repository/budget.repository";
import { BudgetValidationError } from "@/feature/budget/types/budget.types";
import { GetBudgetPlanByRemoteIdUseCase } from "./getBudgetPlanByRemoteId.useCase";

export const createGetBudgetPlanByRemoteIdUseCase = (
  repository: BudgetRepository,
): GetBudgetPlanByRemoteIdUseCase => ({
  async execute(input) {
    if (!input.accountRemoteId.trim()) {
      return {
        success: false,
        error: BudgetValidationError("Account context is required."),
      };
    }

    if (!input.remoteId.trim()) {
      return {
        success: false,
        error: BudgetValidationError("Budget remote id is required."),
      };
    }

    return repository.getBudgetPlanByRemoteId({
      accountRemoteId: input.accountRemoteId.trim(),
      remoteId: input.remoteId.trim(),
    });
  },
});
