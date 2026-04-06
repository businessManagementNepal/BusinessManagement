import { CategoryDatasource } from "@/feature/categories/data/dataSource/category.datasource";
import {
  CategoryDatabaseError,
  CategoryError,
  CategoryNotFoundError,
  CategoryOperationResult,
  CategoryUnknownError,
  CategoryValidationError,
  SaveCategoryPayload,
} from "@/feature/categories/types/category.types";
import { mapCategoryModelToDomain } from "./mapper/category.mapper";
import { CategoryRepository } from "./category.repository";

const mapDatasourceError = (error: Error): CategoryError => {
  const normalized = error.message.trim();
  const lower = normalized.toLowerCase();
  if (lower.includes("not found")) return CategoryNotFoundError;
  if (lower.includes("required") || lower.includes("exists")) {
    return CategoryValidationError(normalized);
  }
  if (
    lower.includes("database") ||
    lower.includes("schema") ||
    lower.includes("table") ||
    lower.includes("adapter")
  ) {
    return CategoryDatabaseError;
  }
  return {
    ...CategoryUnknownError,
    message: normalized || CategoryUnknownError.message,
  };
};

export const createCategoryRepository = (
  datasource: CategoryDatasource,
): CategoryRepository => ({
  async ensureSystemCategories(payload): Promise<CategoryOperationResult> {
    const result = await datasource.ensureSystemCategories(payload);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }
    return result;
  },
  async getCategoriesByAccountRemoteId(accountRemoteId) {
    const result = await datasource.getCategoriesByAccountRemoteId(accountRemoteId);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }
    return { success: true, value: result.value.map(mapCategoryModelToDomain) };
  },
  async saveCategory(payload: SaveCategoryPayload) {
    const result = await datasource.saveCategory(payload);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }
    return { success: true, value: mapCategoryModelToDomain(result.value) };
  },
  async archiveCategoryByRemoteId(remoteId: string) {
    const result = await datasource.archiveCategoryByRemoteId(remoteId);
    if (!result.success) {
      return { success: false, error: mapDatasourceError(result.error) };
    }
    return result;
  },
});
