import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { CategoryRepository } from "@/feature/categories/data/repository/category.repository";
import {
  CategoryKind,
  CategoryScope,
  CategoryValidationError,
} from "@/feature/categories/types/category.types";
import { SaveCategoryUseCase } from "./saveCategory.useCase";

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const isKindAllowedForAccountType = (
  accountType: "personal" | "business",
  kind: "income" | "expense" | "business" | "product",
): boolean => {
  if (accountType === AccountType.Business) {
    return (
      kind === CategoryKind.Income ||
      kind === CategoryKind.Expense ||
      kind === CategoryKind.Business ||
      kind === CategoryKind.Product
    );
  }

  return kind === CategoryKind.Income || kind === CategoryKind.Expense;
};

export const createSaveCategoryUseCase = (
  repository: CategoryRepository,
): SaveCategoryUseCase => ({
  async execute(payload) {
    const normalizedRemoteId = normalizeRequired(payload.remoteId);
    const normalizedOwnerUserRemoteId = normalizeRequired(
      payload.ownerUserRemoteId,
    );
    const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
    const normalizedName = normalizeRequired(payload.name);
    const normalizedDescription = normalizeOptional(payload.description);

    if (!normalizedRemoteId) {
      return {
        success: false,
        error: CategoryValidationError("Category remote id is required."),
      };
    }

    if (!normalizedOwnerUserRemoteId) {
      return {
        success: false,
        error: CategoryValidationError("Owner user remote id is required."),
      };
    }

    if (!normalizedAccountRemoteId) {
      return {
        success: false,
        error: CategoryValidationError("Account remote id is required."),
      };
    }

    if (!normalizedName) {
      return {
        success: false,
        error: CategoryValidationError("Category name is required."),
      };
    }

    if (
      payload.accountType === AccountType.Business &&
      payload.scope !== CategoryScope.Business
    ) {
      return {
        success: false,
        error: CategoryValidationError(
          "Category scope does not match the active account type.",
        ),
      };
    }

    if (
      payload.accountType === AccountType.Personal &&
      payload.scope !== CategoryScope.Personal
    ) {
      return {
        success: false,
        error: CategoryValidationError(
          "Category scope does not match the active account type.",
        ),
      };
    }

    if (!isKindAllowedForAccountType(payload.accountType, payload.kind)) {
      return {
        success: false,
        error: CategoryValidationError(
          "Selected category type is not allowed for this account.",
        ),
      };
    }

    return repository.saveCategory({
      ...payload,
      remoteId: normalizedRemoteId,
      ownerUserRemoteId: normalizedOwnerUserRemoteId,
      accountRemoteId: normalizedAccountRemoteId,
      name: normalizedName,
      description: normalizedDescription,
    });
  },
});
