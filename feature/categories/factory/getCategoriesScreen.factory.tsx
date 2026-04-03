import React from "react";
import { createLocalCategoryDatasource } from "@/feature/categories/data/dataSource/local.category.datasource.impl";
import { createCategoryRepository } from "@/feature/categories/data/repository/category.repository.impl";
import { CategoriesScreen } from "@/feature/categories/ui/CategoriesScreen";
import { createGetCategoriesUseCase } from "@/feature/categories/useCase/getCategories.useCase.impl";
import { createSaveCategoryUseCase } from "@/feature/categories/useCase/saveCategory.useCase.impl";
import { useCategoriesViewModel } from "@/feature/categories/viewModel/categories.viewModel.impl";
import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import appDatabase from "@/shared/database/appDatabase";

type Props = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountType: AccountTypeValue | null;
  canManage: boolean;
};

export function GetCategoriesScreenFactory({
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountType,
  canManage,
}: Props) {
  const datasource = React.useMemo(
    () => createLocalCategoryDatasource(appDatabase),
    [],
  );
  const repository = React.useMemo(
    () => createCategoryRepository(datasource),
    [datasource],
  );
  const getCategoriesUseCase = React.useMemo(
    () => createGetCategoriesUseCase(repository),
    [repository],
  );
  const saveCategoryUseCase = React.useMemo(
    () => createSaveCategoryUseCase(repository),
    [repository],
  );

  const viewModel = useCategoriesViewModel({
    ownerUserRemoteId: activeUserRemoteId,
    accountRemoteId: activeAccountRemoteId,
    accountType: activeAccountType,
    canManage,
    getCategoriesUseCase,
    saveCategoryUseCase,
  });

  return <CategoriesScreen viewModel={viewModel} />;
}
