import { BudgetRepository } from "@/feature/budget/data/repository/budget.repository";
import {
  BudgetValidationError,
  DuplicateBudgetError,
  SaveBudgetPlanPayload,
} from "@/feature/budget/types/budget.types";
import { validateBudgetMonth } from "@/feature/budget/validation/budgetMonth.validation";
import { UpdateBudgetPlanUseCase } from "./updateBudgetPlan.useCase";

export const createUpdateBudgetPlanUseCase = (
  repository: BudgetRepository,
): UpdateBudgetPlanUseCase => ({
  async execute(payload: SaveBudgetPlanPayload) {
    if (!payload.remoteId.trim()) {
      return {
        success: false,
        error: BudgetValidationError("Budget remote id is required."),
      };
    }

    if (!payload.ownerUserRemoteId.trim()) {
      return {
        success: false,
        error: BudgetValidationError("User context is required."),
      };
    }

    if (!payload.accountRemoteId.trim()) {
      return {
        success: false,
        error: BudgetValidationError("Account context is required."),
      };
    }

    const budgetMonthResult = validateBudgetMonth(payload.budgetMonth);

    if (!budgetMonthResult.success) {
      return budgetMonthResult;
    }

    if (!payload.categoryRemoteId.trim()) {
      return {
        success: false,
        error: BudgetValidationError("Budget category is required."),
      };
    }

    if (!payload.categoryNameSnapshot.trim()) {
      return {
        success: false,
        error: BudgetValidationError("Budget category label is required."),
      };
    }

    if (!Number.isFinite(payload.plannedAmount) || payload.plannedAmount <= 0) {
      return {
        success: false,
        error: BudgetValidationError("Planned amount must be greater than zero."),
      };
    }

    const existingBudgets = await repository.getBudgetPlansByAccountRemoteId(
      payload.accountRemoteId,
    );

    if (!existingBudgets.success) {
      return existingBudgets;
    }

    const duplicateBudget = existingBudgets.value.find(
      (budgetPlan) =>
        budgetPlan.remoteId !== payload.remoteId.trim() &&
        budgetPlan.budgetMonth === budgetMonthResult.value &&
        budgetPlan.categoryRemoteId === payload.categoryRemoteId.trim(),
    );

    if (duplicateBudget) {
      return {
        success: false,
        error: DuplicateBudgetError(
          payload.categoryNameSnapshot.trim(),
          budgetMonthResult.value,
        ),
      };
    }

    return repository.updateBudgetPlan({
      ...payload,
      budgetMonth: budgetMonthResult.value,
      categoryRemoteId: payload.categoryRemoteId.trim(),
      categoryNameSnapshot: payload.categoryNameSnapshot.trim(),
    });
  },
});
