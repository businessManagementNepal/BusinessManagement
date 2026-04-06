import { CategoryOperationResult } from "@/feature/categories/types/category.types";

export interface ArchiveCategoryUseCase {
  execute(remoteId: string): Promise<CategoryOperationResult>;
}
