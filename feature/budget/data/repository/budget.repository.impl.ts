import { BudgetDatasource } from "@/feature/budget/data/dataSource/budget.datasource";
import { mapBudgetPlanModelToDomain } from "@/feature/budget/data/repository/mapper/budget.mapper";
import {
  BudgetDatabaseError,
  BudgetError,
  BudgetNotFoundError,
  BudgetUnknownError,
  BudgetValidationError,
  SaveBudgetPlanPayload,
} from "@/feature/budget/types/budget.types";
import { BudgetRepository } from "./budget.repository";

const mapDatasourceError = (error: Error): BudgetError => {
  const normalizedMessage = error.message.trim();
  const lowerMessage = normalizedMessage.toLowerCase();

  if (lowerMessage.includes("not found")) {
    return BudgetNotFoundError;
  }

  if (
    lowerMessage.includes("required") ||
    lowerMessage.includes("duplicate") ||
    lowerMessage.includes("already exists")
  ) {
    return BudgetValidationError(normalizedMessage);
  }

  if (
    lowerMessage.includes("database") ||
    lowerMessage.includes("schema") ||
    lowerMessage.includes("table") ||
    lowerMessage.includes("adapter")
  ) {
    return BudgetDatabaseError;
  }

  return {
    ...BudgetUnknownError,
    message: normalizedMessage || BudgetUnknownError.message,
  };
};

export const createBudgetRepository = (
  datasource: BudgetDatasource,
): BudgetRepository => ({
  async getBudgetPlansByAccountRemoteId(accountRemoteId) {
    const result = await datasource.getBudgetPlansByAccountRemoteId(accountRemoteId);

    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }

    return {
      success: true,
      value: result.value.map(mapBudgetPlanModelToDomain),
    };
  },

  async getBudgetPlanByRemoteId(input) {
    const result = await datasource.getBudgetPlanByRemoteId(input);

    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }

    if (!result.value) {
      return { success: false, error: BudgetNotFoundError };
    }

    return { success: true, value: mapBudgetPlanModelToDomain(result.value) };
  },

  async createBudgetPlan(payload: SaveBudgetPlanPayload) {
    const result = await datasource.saveBudgetPlan(payload);

    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }

    return { success: true, value: mapBudgetPlanModelToDomain(result.value) };
  },

  async updateBudgetPlan(payload: SaveBudgetPlanPayload) {
    const result = await datasource.saveBudgetPlan(payload);

    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }

    return { success: true, value: mapBudgetPlanModelToDomain(result.value) };
  },

  async deleteBudgetPlanByRemoteId(input) {
    const result = await datasource.deleteBudgetPlanByRemoteId(input);

    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }

    return result;
  },
});
