import { CategoryRepository } from "@/feature/categories/data/repository/category.repository";
import { CategoryValidationError } from "@/feature/categories/types/category.types";
import { GetCategoriesUseCase } from "./getCategories.useCase";

export const createGetCategoriesUseCase = (
  repository: CategoryRepository,
): GetCategoriesUseCase => ({
  async execute(payload) {
    if (!payload.ownerUserRemoteId.trim()) {
      return {
        success: false,
        error: CategoryValidationError("Owner user remote id is required."),
      };
    }
    if (!payload.accountRemoteId.trim()) {
      return {
        success: false,
        error: CategoryValidationError("Account remote id is required."),
      };
    }

    const seedResult = await repository.ensureSystemCategories(payload);
    if (!seedResult.success) {
      return seedResult;
    }

    return repository.getCategoriesByAccountRemoteId(payload.accountRemoteId);
  },
});
