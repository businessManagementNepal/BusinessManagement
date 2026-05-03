import { CategoryKindValue } from "@/feature/categories/types/category.types";

export const BudgetListFilter = {
  All: "all",
  ThisMonth: "this_month",
  Overspent: "overspent",
} as const;

export type BudgetListFilterValue =
  (typeof BudgetListFilter)[keyof typeof BudgetListFilter];

export type BudgetCategoryOption = {
  remoteId: string;
  label: string;
  kind: CategoryKindValue;
};

export type BudgetSummaryCardState = {
  id: string;
  label: string;
  value: string;
  tone: "neutral" | "success" | "alert";
};

export type BudgetListItemState = {
  remoteId: string;
  budgetMonth: string;
  title: string;
  subtitle: string;
  plannedAmountLabel: string;
  spentAmountLabel: string;
  remainingAmountLabel: string;
  monthLabel: string;
  noteLabel: string | null;
  progressPercent: number;
  isOverspent: boolean;
  statusLabel: "ON TRACK" | "OVER";
};

export type BudgetEditorMode = "create" | "edit";

export type BudgetEditorState = {
  visible: boolean;
  mode: BudgetEditorMode;
  remoteId: string | null;
  budgetMonth: string;
  categoryRemoteId: string;
  plannedAmount: string;
  note: string;
  errorMessage: string | null;
  isSaving: boolean;
};

export type BudgetQuickCategoryState = {
  name: string;
  errorMessage: string | null;
  isSaving: boolean;
};

export type BudgetDetailState = {
  remoteId: string;
  title: string;
  subtitle: string;
  plannedAmountLabel: string;
  spentAmountLabel: string;
  remainingAmountLabel: string;
  statusLabel: string;
  noteLabel: string | null;
};

export interface BudgetViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  monthLabel: string;
  summaryCards: readonly BudgetSummaryCardState[];
  budgetItems: readonly BudgetListItemState[];
  selectedFilter: BudgetListFilterValue;
  searchQuery: string;
  emptyStateMessage: string;
  emptyStateActionLabel: string | null;
  categoryOptions: readonly BudgetCategoryOption[];
  editorState: BudgetEditorState;
  quickCategoryState: BudgetQuickCategoryState;
  detailState: BudgetDetailState | null;
  isDetailVisible: boolean;
  deleteConfirmationVisible: boolean;
  deleteErrorMessage: string | null;
  isDeleting: boolean;
  canCreate: boolean;
  onRefresh: () => Promise<void>;
  onChangeFilter: (value: BudgetListFilterValue) => void;
  onChangeSearchQuery: (value: string) => void;
  onPressEmptyStateAction: () => void;
  onOpenCreate: () => void;
  onOpenDetail: (remoteId: string) => Promise<void>;
  onOpenEdit: (remoteId: string) => Promise<void>;
  onCloseEditor: () => void;
  onEditorFieldChange: (
    field: "budgetMonth" | "categoryRemoteId" | "plannedAmount" | "note",
    value: string,
  ) => void;
  onQuickCategoryNameChange: (value: string) => void;
  onCreateQuickExpenseCategory: () => Promise<void>;
  onSubmit: () => Promise<void>;
  onCloseDetail: () => void;
  onRequestDeleteBudget: () => void;
  onCancelDeleteBudget: () => void;
  onConfirmDeleteBudget: () => Promise<void>;
  onEditFromDetail: () => Promise<void>;
}
