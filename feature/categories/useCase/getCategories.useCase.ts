import { CategoriesResult } from "@/feature/categories/types/category.types";
import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";

export interface GetCategoriesUseCase {
  execute(payload: {
    ownerUserRemoteId: string;
    accountRemoteId: string;
    accountType: AccountTypeValue;
  }): Promise<CategoriesResult>;
}
