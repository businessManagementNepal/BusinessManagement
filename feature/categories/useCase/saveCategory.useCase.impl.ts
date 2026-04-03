import { CategoryRepository } from "@/feature/categories/data/repository/category.repository";
import { CategoryValidationError } from "@/feature/categories/types/category.types";
import { SaveCategoryUseCase } from "./saveCategory.useCase";

export const createSaveCategoryUseCase = (
  repository: CategoryRepository,
): SaveCategoryUseCase => ({
  async execute(payload) {
    if (!payload.name.trim()) {
      return {
        success: false,
        error: CategoryValidationError("Category name is required."),
      };
    }

    return repository.saveCategory(payload);
  },
});
