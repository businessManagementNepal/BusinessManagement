import {
  CategoryResult,
  SaveCategoryPayload,
} from "@/feature/categories/types/category.types";

export interface SaveCategoryUseCase {
  execute(payload: SaveCategoryPayload): Promise<CategoryResult>;
}
