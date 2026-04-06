import { CategoryRepository } from "@/feature/categories/data/repository/category.repository";
import {
  CategoryOperationResult,
  CategoryValidationError,
} from "@/feature/categories/types/category.types";
import { ArchiveCategoryUseCase } from "./archiveCategory.useCase";

export const createArchiveCategoryUseCase = (
  repository: CategoryRepository,
): ArchiveCategoryUseCase => ({
  async execute(remoteId: string): Promise<CategoryOperationResult> {
    const normalizedRemoteId = remoteId.trim();
    if (!normalizedRemoteId) {
      return {
        success: false,
        error: CategoryValidationError("Category remote id is required."),
      };
    }

    return repository.archiveCategoryByRemoteId(normalizedRemoteId);
  },
});
