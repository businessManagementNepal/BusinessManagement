import {
  CategoriesResult,
  CategoryOperationResult,
  CategoryResult,
  SaveCategoryPayload,
} from "@/feature/categories/types/category.types";
import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";

export interface CategoryRepository {
  ensureSystemCategories(payload: {
    ownerUserRemoteId: string;
    accountRemoteId: string;
    accountType: AccountTypeValue;
  }): Promise<CategoryOperationResult>;
  getCategoriesByAccountRemoteId(accountRemoteId: string): Promise<CategoriesResult>;
  saveCategory(payload: SaveCategoryPayload): Promise<CategoryResult>;
}
