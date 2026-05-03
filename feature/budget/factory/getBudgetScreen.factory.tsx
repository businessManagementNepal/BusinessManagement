import { createLocalAuditDatasource } from "@/feature/audit/data/dataSource/local.audit.datasource.impl";
import { createAuditRepository } from "@/feature/audit/data/repository/audit.repository.impl";
import { createRecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase.impl";
import { createLocalBudgetDatasource } from "@/feature/budget/data/dataSource/local.budget.datasource.impl";
import { createBudgetRepository } from "@/feature/budget/data/repository/budget.repository.impl";
import { BudgetScreen } from "@/feature/budget/ui/BudgetScreen";
import { createCreateBudgetPlanUseCase } from "@/feature/budget/useCase/createBudgetPlan.useCase.impl";
import { createDeleteBudgetPlanUseCase } from "@/feature/budget/useCase/deleteBudgetPlan.useCase.impl";
import { createGetBudgetPlanByRemoteIdUseCase } from "@/feature/budget/useCase/getBudgetPlanByRemoteId.useCase.impl";
import { createUpdateBudgetPlanUseCase } from "@/feature/budget/useCase/updateBudgetPlan.useCase.impl";
import { useBudgetViewModel } from "@/feature/budget/viewModel/budget.viewModel.impl";
import { createLocalCategoryDatasource } from "@/feature/categories/data/dataSource/local.category.datasource.impl";
import { createCategoryRepository } from "@/feature/categories/data/repository/category.repository.impl";
import { createGetCategoriesUseCase } from "@/feature/categories/useCase/getCategories.useCase.impl";
import { createSaveCategoryUseCase } from "@/feature/categories/useCase/saveCategory.useCase.impl";
import appDatabase from "@/shared/database/appDatabase";
import { createLocalBudgetProgressDatasource } from "@/shared/readModel/budgetProgress/data/dataSource/local.budgetProgress.datasource.impl";
import { createBudgetProgressRepository } from "@/shared/readModel/budgetProgress/data/repository/budgetProgress.repository.impl";
import { createGetBudgetProgressReadModelUseCase } from "@/shared/readModel/budgetProgress/useCase/getBudgetProgressReadModel.useCase.impl";
import React, { useMemo } from "react";

export type GetBudgetScreenFactoryProps = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  onOpenCategoryManager?: () => void;
};

export function GetBudgetScreenFactory({
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  onOpenCategoryManager,
}: GetBudgetScreenFactoryProps) {
  const budgetDatasource = useMemo(
    () => createLocalBudgetDatasource(appDatabase),
    [],
  );
  const budgetRepository = useMemo(
    () => createBudgetRepository(budgetDatasource),
    [budgetDatasource],
  );
  const getBudgetPlanByRemoteIdUseCase = useMemo(
    () => createGetBudgetPlanByRemoteIdUseCase(budgetRepository),
    [budgetRepository],
  );
  const createBudgetPlanUseCase = useMemo(
    () => createCreateBudgetPlanUseCase(budgetRepository),
    [budgetRepository],
  );
  const updateBudgetPlanUseCase = useMemo(
    () => createUpdateBudgetPlanUseCase(budgetRepository),
    [budgetRepository],
  );
  const auditDatasource = useMemo(
    () => createLocalAuditDatasource(appDatabase),
    [],
  );
  const auditRepository = useMemo(
    () => createAuditRepository(auditDatasource),
    [auditDatasource],
  );
  const recordAuditEventUseCase = useMemo(
    () => createRecordAuditEventUseCase(auditRepository),
    [auditRepository],
  );
  const deleteBudgetPlanUseCase = useMemo(
    () =>
      createDeleteBudgetPlanUseCase(
        budgetRepository,
        recordAuditEventUseCase,
      ),
    [budgetRepository, recordAuditEventUseCase],
  );

  const categoryDatasource = useMemo(
    () => createLocalCategoryDatasource(appDatabase),
    [],
  );
  const categoryRepository = useMemo(
    () => createCategoryRepository(categoryDatasource),
    [categoryDatasource],
  );
  const getCategoriesUseCase = useMemo(
    () => createGetCategoriesUseCase(categoryRepository),
    [categoryRepository],
  );
  const saveCategoryUseCase = useMemo(
    () => createSaveCategoryUseCase(categoryRepository),
    [categoryRepository],
  );
  const budgetProgressDatasource = useMemo(
    () => createLocalBudgetProgressDatasource(appDatabase),
    [],
  );
  const budgetProgressRepository = useMemo(
    () => createBudgetProgressRepository(budgetProgressDatasource),
    [budgetProgressDatasource],
  );
  const getBudgetProgressReadModelUseCase = useMemo(
    () => createGetBudgetProgressReadModelUseCase(budgetProgressRepository),
    [budgetProgressRepository],
  );

  const viewModel = useBudgetViewModel({
    ownerUserRemoteId: activeUserRemoteId,
    accountRemoteId: activeAccountRemoteId,
    currencyCode: activeAccountCurrencyCode,
    countryCode: activeAccountCountryCode,
    getBudgetPlanByRemoteIdUseCase,
    createBudgetPlanUseCase,
    updateBudgetPlanUseCase,
    deleteBudgetPlanUseCase,
    getCategoriesUseCase,
    saveCategoryUseCase,
    getBudgetProgressReadModelUseCase,
    onOpenCategoryManager,
  });

  return <BudgetScreen viewModel={viewModel} />;
}
