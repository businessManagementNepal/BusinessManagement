import { SaveCategoryPayload } from "@/feature/categories/types/category.types";
import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { Result } from "@/shared/types/result.types";
import { CategoryModel } from "./db/category.model";

export interface CategoryDatasource {
  ensureSystemCategories(payload: {
    ownerUserRemoteId: string;
    accountRemoteId: string;
    accountType: AccountTypeValue;
  }): Promise<Result<boolean>>;
  getCategoriesByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<CategoryModel[]>>;
  saveCategory(payload: SaveCategoryPayload): Promise<Result<CategoryModel>>;
}
