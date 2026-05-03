import { Result } from "@/shared/types/result.types";

export const BudgetSyncStatus = {
  PendingCreate: "pending_create",
  PendingUpdate: "pending_update",
  PendingDelete: "pending_delete",
  Synced: "synced",
  Failed: "failed",
} as const;

export type BudgetSyncStatusValue =
  (typeof BudgetSyncStatus)[keyof typeof BudgetSyncStatus];

export type BudgetPlan = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  budgetMonth: string;
  categoryRemoteId: string;
  categoryNameSnapshot: string;
  currencyCode: string | null;
  plannedAmount: number;
  note: string | null;
  createdAt: number;
  updatedAt: number;
};

export type SaveBudgetPlanPayload = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  budgetMonth: string;
  categoryRemoteId: string;
  categoryNameSnapshot: string;
  currencyCode: string | null;
  plannedAmount: number;
  note: string | null;
};

export type BudgetScopedRemoteIdInput = {
  accountRemoteId: string;
  remoteId: string;
};

export const BudgetErrorType = {
  DatabaseError: "DATABASE_ERROR",
  ValidationError: "VALIDATION_ERROR",
  BudgetNotFound: "BUDGET_NOT_FOUND",
  DuplicateBudget: "DUPLICATE_BUDGET",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type BudgetError = {
  type: (typeof BudgetErrorType)[keyof typeof BudgetErrorType];
  message: string;
};

export const BudgetDatabaseError: BudgetError = {
  type: BudgetErrorType.DatabaseError,
  message: "Unable to process budget data right now. Please try again.",
};

export const BudgetValidationError = (message: string): BudgetError => ({
  type: BudgetErrorType.ValidationError,
  message,
});

export const BudgetNotFoundError: BudgetError = {
  type: BudgetErrorType.BudgetNotFound,
  message: "The requested budget was not found.",
};

export const DuplicateBudgetError = (
  categoryName: string,
  budgetMonth: string,
): BudgetError => ({
  type: BudgetErrorType.DuplicateBudget,
  message: `A budget already exists for ${categoryName} in ${budgetMonth}.`,
});

export const BudgetUnknownError: BudgetError = {
  type: BudgetErrorType.UnknownError,
  message: "An unexpected budget error occurred.",
};

export type BudgetPlanResult = Result<BudgetPlan, BudgetError>;
export type BudgetPlansResult = Result<BudgetPlan[], BudgetError>;
export type BudgetOperationResult = Result<boolean, BudgetError>;
