import {
  BudgetError,
  BudgetValidationError,
} from "@/feature/budget/types/budget.types";
import { BudgetProgressRepository } from "@/shared/readModel/budgetProgress/data/repository/budgetProgress.repository";
import { BudgetProgressQuery } from "@/shared/readModel/budgetProgress/types/budgetProgress.query.types";
import { BudgetProgressReadModel } from "@/shared/readModel/budgetProgress/types/budgetProgress.readModel.types";
import { Result } from "@/shared/types/result.types";
import { GetBudgetProgressReadModelUseCase } from "./getBudgetProgressReadModel.useCase";

class GetBudgetProgressReadModelUseCaseImpl
  implements GetBudgetProgressReadModelUseCase
{
  constructor(private readonly repository: BudgetProgressRepository) {}

  async execute(
    query: BudgetProgressQuery,
  ): Promise<Result<BudgetProgressReadModel, BudgetError>> {
    const normalizedOwnerUserRemoteId = query.ownerUserRemoteId.trim();
    const normalizedAccountRemoteId = query.accountRemoteId.trim();

    if (!normalizedOwnerUserRemoteId) {
      return {
        success: false,
        error: BudgetValidationError("User context is required."),
      };
    }

    if (!normalizedAccountRemoteId) {
      return {
        success: false,
        error: BudgetValidationError("Account context is required."),
      };
    }

    return this.repository.getBudgetProgressReadModel({
      ownerUserRemoteId: normalizedOwnerUserRemoteId,
      accountRemoteId: normalizedAccountRemoteId,
    });
  }
}

export const createGetBudgetProgressReadModelUseCase = (
  repository: BudgetProgressRepository,
): GetBudgetProgressReadModelUseCase =>
  new GetBudgetProgressReadModelUseCaseImpl(repository);
