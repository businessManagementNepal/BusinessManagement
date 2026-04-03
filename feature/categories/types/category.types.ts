import { Result } from "@/shared/types/result.types";
import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";

export const CategoryKind = {
  Income: "income",
  Expense: "expense",
  Business: "business",
  Product: "product",
} as const;

export type CategoryKindValue =
  (typeof CategoryKind)[keyof typeof CategoryKind];

export const CategoryScope = {
  Personal: "personal",
  Business: "business",
} as const;

export type CategoryScopeValue =
  (typeof CategoryScope)[keyof typeof CategoryScope];

export type Category = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  accountType: AccountTypeValue;
  scope: CategoryScopeValue;
  kind: CategoryKindValue;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: number;
  updatedAt: number;
};

export type SaveCategoryPayload = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  accountType: AccountTypeValue;
  scope: CategoryScopeValue;
  kind: CategoryKindValue;
  name: string;
  description: string | null;
  isSystem: boolean;
};

export const CategoryErrorType = {
  DatabaseError: "DATABASE_ERROR",
  ValidationError: "VALIDATION_ERROR",
  CategoryNotFound: "CATEGORY_NOT_FOUND",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type CategoryError = {
  type: (typeof CategoryErrorType)[keyof typeof CategoryErrorType];
  message: string;
};

export const CategoryDatabaseError: CategoryError = {
  type: CategoryErrorType.DatabaseError,
  message: "Unable to process the category right now. Please try again.",
};

export const CategoryValidationError = (message: string): CategoryError => ({
  type: CategoryErrorType.ValidationError,
  message,
});

export const CategoryNotFoundError: CategoryError = {
  type: CategoryErrorType.CategoryNotFound,
  message: "The requested category was not found.",
};

export const CategoryUnknownError: CategoryError = {
  type: CategoryErrorType.UnknownError,
  message: "An unexpected category error occurred.",
};

export type CategoryResult = Result<Category, CategoryError>;
export type CategoriesResult = Result<Category[], CategoryError>;
export type CategoryOperationResult = Result<boolean, CategoryError>;

export const CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: CategoryKind.Income, label: "Income" },
  { value: CategoryKind.Expense, label: "Expense" },
  { value: CategoryKind.Business, label: "Business" },
  { value: CategoryKind.Product, label: "Product" },
] as const;
