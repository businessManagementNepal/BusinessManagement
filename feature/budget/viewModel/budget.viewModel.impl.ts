import { CreateBudgetPlanUseCase } from "@/feature/budget/useCase/createBudgetPlan.useCase";
import { DeleteBudgetPlanUseCase } from "@/feature/budget/useCase/deleteBudgetPlan.useCase";
import { GetBudgetPlanByRemoteIdUseCase } from "@/feature/budget/useCase/getBudgetPlanByRemoteId.useCase";
import { UpdateBudgetPlanUseCase } from "@/feature/budget/useCase/updateBudgetPlan.useCase";
import { BudgetPlan } from "@/feature/budget/types/budget.types";
import {
  BudgetDetailState,
  BudgetEditorState,
  BudgetQuickCategoryState,
  BudgetListFilter,
  BudgetListFilterValue,
  BudgetListItemState,
  BudgetSummaryCardState,
  BudgetViewModel,
} from "@/feature/budget/viewModel/budget.viewModel";
import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import {
  Category,
  CategoryKind,
  CategoryScope,
} from "@/feature/categories/types/category.types";
import { GetCategoriesUseCase } from "@/feature/categories/useCase/getCategories.useCase";
import { SaveCategoryUseCase } from "@/feature/categories/useCase/saveCategory.useCase";
import {
  BudgetProgressItem,
  BudgetProgressSummary,
} from "@/shared/readModel/budgetProgress/types/budgetProgress.readModel.types";
import { GetBudgetProgressReadModelUseCase } from "@/shared/readModel/budgetProgress/useCase/getBudgetProgressReadModel.useCase";
import {
  formatCurrencyAmount,
  resolveCurrencyCode,
} from "@/shared/utils/currency/accountCurrency";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseBudgetViewModelParams = {
  ownerUserRemoteId: string | null;
  accountRemoteId: string | null;
  currencyCode: string | null;
  countryCode: string | null;
  getBudgetPlanByRemoteIdUseCase: GetBudgetPlanByRemoteIdUseCase;
  createBudgetPlanUseCase: CreateBudgetPlanUseCase;
  updateBudgetPlanUseCase: UpdateBudgetPlanUseCase;
  deleteBudgetPlanUseCase: DeleteBudgetPlanUseCase;
  getCategoriesUseCase: GetCategoriesUseCase;
  saveCategoryUseCase: SaveCategoryUseCase;
  getBudgetProgressReadModelUseCase: GetBudgetProgressReadModelUseCase;
  onOpenCategoryManager?: () => void;
};

const EMPTY_SUMMARY: BudgetProgressSummary = {
  currentMonthPlannedAmount: 0,
  currentMonthSpentAmount: 0,
  currentMonthRemainingAmount: 0,
  hasOverspentBudget: false,
};

const getCurrentBudgetMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const EMPTY_EDITOR_STATE: BudgetEditorState = {
  visible: false,
  mode: "create",
  remoteId: null,
  budgetMonth: getCurrentBudgetMonth(),
  categoryRemoteId: "",
  plannedAmount: "0",
  note: "",
  errorMessage: null,
  isSaving: false,
};

const EMPTY_QUICK_CATEGORY_STATE: BudgetQuickCategoryState = {
  name: "",
  errorMessage: null,
  isSaving: false,
};

const formatBudgetMonth = (budgetMonth: string): string => {
  const [yearText, monthText] = budgetMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return budgetMonth;
  }

  const date = new Date(year, month - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return budgetMonth;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const buildBudgetListItemState = (
  progressItem: BudgetProgressItem,
  currencyCode: string,
  countryCode: string | null,
): BudgetListItemState => ({
  remoteId: progressItem.budgetRemoteId,
  budgetMonth: progressItem.budgetMonth,
  title: progressItem.categoryNameSnapshot,
  subtitle: `${formatBudgetMonth(progressItem.budgetMonth)} budget`,
  plannedAmountLabel: formatCurrencyAmount({
    amount: progressItem.plannedAmount,
    currencyCode,
    countryCode,
  }),
  spentAmountLabel: formatCurrencyAmount({
    amount: progressItem.spentAmount,
    currencyCode,
    countryCode,
  }),
  remainingAmountLabel: formatCurrencyAmount({
    amount: Math.abs(progressItem.remainingAmount),
    currencyCode,
    countryCode,
  }),
  monthLabel: formatBudgetMonth(progressItem.budgetMonth),
  noteLabel: progressItem.note?.trim() || null,
  progressPercent: progressItem.progressPercent,
  isOverspent: progressItem.isOverspent,
  statusLabel: progressItem.isOverspent ? "OVER" : "ON TRACK",
});

const buildDetailState = (
  progressItem: BudgetProgressItem,
  currencyCode: string,
  countryCode: string | null,
): BudgetDetailState => ({
  remoteId: progressItem.budgetRemoteId,
  title: progressItem.categoryNameSnapshot,
  subtitle: formatBudgetMonth(progressItem.budgetMonth),
  plannedAmountLabel: formatCurrencyAmount({
    amount: progressItem.plannedAmount,
    currencyCode,
    countryCode,
  }),
  spentAmountLabel: formatCurrencyAmount({
    amount: progressItem.spentAmount,
    currencyCode,
    countryCode,
  }),
  remainingAmountLabel: formatCurrencyAmount({
    amount: Math.abs(progressItem.remainingAmount),
    currencyCode,
    countryCode,
  }),
  statusLabel: progressItem.isOverspent ? "Over budget" : "On track",
  noteLabel: progressItem.note?.trim() || null,
});

const mapBudgetPlanToEditorState = (budgetPlan: BudgetPlan): BudgetEditorState => ({
  visible: true,
  mode: "edit",
  remoteId: budgetPlan.remoteId,
  budgetMonth: budgetPlan.budgetMonth,
  categoryRemoteId: budgetPlan.categoryRemoteId,
  plannedAmount: String(budgetPlan.plannedAmount),
  note: budgetPlan.note ?? "",
  errorMessage: null,
  isSaving: false,
});

const buildFallbackProgressItem = (budgetPlan: BudgetPlan): BudgetProgressItem => ({
  budgetRemoteId: budgetPlan.remoteId,
  accountRemoteId: budgetPlan.accountRemoteId,
  budgetMonth: budgetPlan.budgetMonth,
  categoryRemoteId: budgetPlan.categoryRemoteId,
  categoryNameSnapshot: budgetPlan.categoryNameSnapshot,
  plannedAmount: budgetPlan.plannedAmount,
  spentAmount: 0,
  remainingAmount: budgetPlan.plannedAmount,
  progressPercent: 0,
  isOverspent: false,
  currencyCode: budgetPlan.currencyCode,
  note: budgetPlan.note,
});

export const useBudgetViewModel = ({
  ownerUserRemoteId,
  accountRemoteId,
  currencyCode,
  countryCode,
  getBudgetPlanByRemoteIdUseCase,
  createBudgetPlanUseCase,
  updateBudgetPlanUseCase,
  deleteBudgetPlanUseCase,
  getCategoriesUseCase,
  saveCategoryUseCase,
  getBudgetProgressReadModelUseCase,
}: UseBudgetViewModelParams): BudgetViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [budgetProgressItems, setBudgetProgressItems] = useState<
    BudgetProgressItem[]
  >([]);
  const [budgetSummary, setBudgetSummary] =
    useState<BudgetProgressSummary>(EMPTY_SUMMARY);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<BudgetListFilterValue>(
    BudgetListFilter.All,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [editorState, setEditorState] = useState<BudgetEditorState>(
    EMPTY_EDITOR_STATE,
  );
  const [quickCategoryState, setQuickCategoryState] =
    useState<BudgetQuickCategoryState>(EMPTY_QUICK_CATEGORY_STATE);
  const [detailState, setDetailState] = useState<BudgetDetailState | null>(null);
  const [activeDetailRemoteId, setActiveDetailRemoteId] = useState<string | null>(
    null,
  );
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] =
    useState(false);
  const [pendingDeleteBudgetRemoteId, setPendingDeleteBudgetRemoteId] =
    useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const resolvedCurrencyCode = useMemo(
    () => resolveCurrencyCode({ currencyCode, countryCode }),
    [countryCode, currencyCode],
  );

  const loadBudgetData = useCallback(async () => {
    if (!ownerUserRemoteId || !accountRemoteId) {
      setBudgetProgressItems([]);
      setBudgetSummary(EMPTY_SUMMARY);
      setExpenseCategories([]);
      setErrorMessage("A personal account is required to manage budgets.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [budgetProgressResult, categoriesResult] = await Promise.all([
      getBudgetProgressReadModelUseCase.execute({
        ownerUserRemoteId,
        accountRemoteId,
      }),
      getCategoriesUseCase.execute({
        ownerUserRemoteId,
        accountRemoteId,
        accountType: AccountType.Personal,
      }),
    ]);

    if (!budgetProgressResult.success) {
      setBudgetProgressItems([]);
      setBudgetSummary(EMPTY_SUMMARY);
      setExpenseCategories([]);
      setErrorMessage(budgetProgressResult.error.message);
      setIsLoading(false);
      return;
    }

    if (!categoriesResult.success) {
      setBudgetProgressItems([]);
      setBudgetSummary(EMPTY_SUMMARY);
      setExpenseCategories([]);
      setErrorMessage(categoriesResult.error.message);
      setIsLoading(false);
      return;
    }

    setBudgetProgressItems([...budgetProgressResult.value.items]);
    setBudgetSummary(budgetProgressResult.value.summary);
    setExpenseCategories(
      categoriesResult.value.filter(
        (category) => category.kind === CategoryKind.Expense,
      ),
    );
    setErrorMessage(null);
    setIsLoading(false);
  }, [
    accountRemoteId,
    getBudgetProgressReadModelUseCase,
    getCategoriesUseCase,
    ownerUserRemoteId,
  ]);

  useEffect(() => {
    void loadBudgetData();
  }, [loadBudgetData]);

  const budgetProgressByRemoteId = useMemo(
    () =>
      new Map(
        budgetProgressItems.map((progressItem) => [
          progressItem.budgetRemoteId,
          progressItem,
        ]),
      ),
    [budgetProgressItems],
  );

  const budgetItems = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return budgetProgressItems
      .map((progressItem) =>
        buildBudgetListItemState(
          progressItem,
          resolvedCurrencyCode,
          countryCode,
        ),
      )
      .filter((budgetItem) => {
        const matchesSearch =
          normalizedSearchQuery.length === 0 ||
          budgetItem.title.toLowerCase().includes(normalizedSearchQuery) ||
          budgetItem.monthLabel.toLowerCase().includes(normalizedSearchQuery);

        if (!matchesSearch) {
          return false;
        }

        if (selectedFilter === BudgetListFilter.ThisMonth) {
          return budgetItem.budgetMonth === getCurrentBudgetMonth();
        }

        if (selectedFilter === BudgetListFilter.Overspent) {
          return budgetItem.isOverspent;
        }

        return true;
      });
  }, [
    budgetProgressItems,
    countryCode,
    resolvedCurrencyCode,
    searchQuery,
    selectedFilter,
  ]);

  const summaryCards = useMemo<readonly BudgetSummaryCardState[]>(
    () => {
      const isMonthOverBudget = budgetSummary.currentMonthRemainingAmount < 0;

      return [
        {
          id: "planned",
          label: "This Month Planned",
          value: formatCurrencyAmount({
            amount: budgetSummary.currentMonthPlannedAmount,
            currencyCode: resolvedCurrencyCode,
            countryCode,
          }),
          tone: "neutral",
        },
        {
          id: "spent",
          label: "Spent This Month",
          value: formatCurrencyAmount({
            amount: budgetSummary.currentMonthSpentAmount,
            currencyCode: resolvedCurrencyCode,
            countryCode,
          }),
          tone: budgetSummary.hasOverspentBudget ? "alert" : "neutral",
        },
        {
          id: "remaining",
          label: isMonthOverBudget ? "Over This Month" : "Left This Month",
          value: formatCurrencyAmount({
            amount: Math.abs(budgetSummary.currentMonthRemainingAmount),
            currencyCode: resolvedCurrencyCode,
            countryCode,
          }),
          tone: isMonthOverBudget ? "alert" : "success",
        },
      ] as const;
    },
    [budgetSummary, countryCode, resolvedCurrencyCode],
  );

  const monthLabel = useMemo(() => formatBudgetMonth(getCurrentBudgetMonth()), []);

  const emptyStateMessage = useMemo(() => {
    if (expenseCategories.length === 0) {
      return "No expense categories yet. Add one inside the budget form to start planning.";
    }

    if (searchQuery.trim().length > 0 || selectedFilter !== BudgetListFilter.All) {
      return "No budget categories match your current search or filter.";
    }

    return "No budget categories added yet.";
  }, [expenseCategories.length, searchQuery, selectedFilter]);

  const emptyStateActionLabel = useMemo(
    () => (expenseCategories.length === 0 ? "Create New Budget" : null),
    [expenseCategories.length],
  );

  const categoryOptions = useMemo(
    () =>
      expenseCategories.map((category) => ({
        remoteId: category.remoteId,
        label: category.name,
        kind: category.kind,
      })),
    [expenseCategories],
  );

  const onPressEmptyStateAction = useCallback(() => {
    setSuccessMessage(null);
    setDeleteErrorMessage(null);

    if (!ownerUserRemoteId || !accountRemoteId) {
      setErrorMessage("A personal account is required to manage budgets.");
      return;
    }

    setEditorState({
      ...EMPTY_EDITOR_STATE,
      visible: true,
      categoryRemoteId: categoryOptions[0]?.remoteId ?? "",
    });
    setQuickCategoryState(EMPTY_QUICK_CATEGORY_STATE);
    setErrorMessage(null);
  }, [accountRemoteId, categoryOptions, ownerUserRemoteId]);

  const onOpenCreate = useCallback(() => {
    setSuccessMessage(null);
    setDeleteErrorMessage(null);

    if (!ownerUserRemoteId || !accountRemoteId) {
      setErrorMessage("A personal account is required to manage budgets.");
      return;
    }

    setEditorState({
      ...EMPTY_EDITOR_STATE,
      visible: true,
      categoryRemoteId: categoryOptions[0]?.remoteId ?? "",
    });
    setQuickCategoryState(EMPTY_QUICK_CATEGORY_STATE);
    setErrorMessage(null);
  }, [accountRemoteId, categoryOptions, ownerUserRemoteId]);

  const onOpenDetail = useCallback(async (remoteId: string) => {
    setSuccessMessage(null);
    setDeleteErrorMessage(null);

    if (!accountRemoteId) {
      setErrorMessage("Account context is required.");
      return;
    }

    const result = await getBudgetPlanByRemoteIdUseCase.execute({
      accountRemoteId,
      remoteId,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    const progressItem =
      budgetProgressByRemoteId.get(result.value.remoteId) ??
      buildFallbackProgressItem(result.value);

    setDetailState(
      buildDetailState(progressItem, resolvedCurrencyCode, countryCode),
    );
    setActiveDetailRemoteId(result.value.remoteId);
    setDeleteConfirmationVisible(false);
    setPendingDeleteBudgetRemoteId(null);
    setErrorMessage(null);
  }, [
    accountRemoteId,
    budgetProgressByRemoteId,
    countryCode,
    getBudgetPlanByRemoteIdUseCase,
    resolvedCurrencyCode,
  ]);

  const onOpenEdit = useCallback(async (remoteId: string) => {
    setSuccessMessage(null);
    setDeleteErrorMessage(null);

    if (!accountRemoteId) {
      setErrorMessage("Account context is required.");
      return;
    }

    const result = await getBudgetPlanByRemoteIdUseCase.execute({
      accountRemoteId,
      remoteId,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    setEditorState(mapBudgetPlanToEditorState(result.value));
    setQuickCategoryState(EMPTY_QUICK_CATEGORY_STATE);
    setErrorMessage(null);
  }, [accountRemoteId, getBudgetPlanByRemoteIdUseCase]);

  const onCloseEditor = useCallback(() => {
    setEditorState(EMPTY_EDITOR_STATE);
    setQuickCategoryState(EMPTY_QUICK_CATEGORY_STATE);
    setSuccessMessage(null);
  }, []);

  const onEditorFieldChange = useCallback(
    (
      field: "budgetMonth" | "categoryRemoteId" | "plannedAmount" | "note",
      value: string,
    ) => {
      setSuccessMessage(null);
      setEditorState((currentState) => ({
        ...currentState,
        [field]: value,
        errorMessage: null,
      }));
    },
    [],
  );

  const onQuickCategoryNameChange = useCallback((value: string) => {
    setSuccessMessage(null);
    setQuickCategoryState((currentState) => ({
      ...currentState,
      name: value,
      errorMessage: null,
    }));
  }, []);

  const onCreateQuickExpenseCategory = useCallback(async () => {
    if (!ownerUserRemoteId || !accountRemoteId) {
      setQuickCategoryState((currentState) => ({
        ...currentState,
        errorMessage: "A personal account is required to add categories.",
      }));
      return;
    }

    const categoryName = quickCategoryState.name.trim();

    if (!categoryName) {
      setQuickCategoryState((currentState) => ({
        ...currentState,
        errorMessage: "Expense category name is required.",
      }));
      return;
    }

    setQuickCategoryState((currentState) => ({
      ...currentState,
      isSaving: true,
      errorMessage: null,
    }));

    const result = await saveCategoryUseCase.execute({
      remoteId: Crypto.randomUUID(),
      ownerUserRemoteId,
      accountRemoteId,
      accountType: AccountType.Personal,
      scope: CategoryScope.Personal,
      kind: CategoryKind.Expense,
      name: categoryName,
      description: null,
      isSystem: false,
    });

    if (!result.success) {
      setQuickCategoryState((currentState) => ({
        ...currentState,
        isSaving: false,
        errorMessage: result.error.message,
      }));
      return;
    }

    const createdCategory = result.value;

    setExpenseCategories((currentCategories) => {
      const existingIndex = currentCategories.findIndex(
        (category) => category.remoteId === createdCategory.remoteId,
      );

      if (existingIndex === -1) {
        return [...currentCategories, createdCategory].sort((left, right) =>
          left.name.localeCompare(right.name),
        );
      }

      return currentCategories.map((category, index) =>
        index === existingIndex ? createdCategory : category,
      );
    });
    setEditorState((currentState) => ({
      ...currentState,
      categoryRemoteId: createdCategory.remoteId,
      errorMessage: null,
    }));
    setQuickCategoryState(EMPTY_QUICK_CATEGORY_STATE);
    setErrorMessage(null);
  }, [
    accountRemoteId,
    ownerUserRemoteId,
    quickCategoryState.name,
    saveCategoryUseCase,
  ]);

  const onSubmit = useCallback(async () => {
    if (!ownerUserRemoteId || !accountRemoteId) {
      setEditorState((currentState) => ({
        ...currentState,
        errorMessage: "A personal account is required to manage budgets.",
      }));
      return;
    }

    const selectedCategory = expenseCategories.find(
      (category) => category.remoteId === editorState.categoryRemoteId,
    );

    if (!selectedCategory) {
      setEditorState((currentState) => ({
        ...currentState,
        errorMessage: "Please choose or create an expense category.",
      }));
      return;
    }

    const plannedAmount = Number(editorState.plannedAmount.trim());

    setEditorState((currentState) => ({
      ...currentState,
      isSaving: true,
      errorMessage: null,
    }));

    const payload = {
      remoteId: editorState.remoteId ?? Crypto.randomUUID(),
      ownerUserRemoteId,
      accountRemoteId,
      budgetMonth: editorState.budgetMonth.trim(),
      categoryRemoteId: selectedCategory.remoteId,
      categoryNameSnapshot: selectedCategory.name,
      currencyCode: resolvedCurrencyCode,
      plannedAmount,
      note: editorState.note.trim() ? editorState.note.trim() : null,
    };

    const result =
      editorState.mode === "create"
        ? await createBudgetPlanUseCase.execute(payload)
        : await updateBudgetPlanUseCase.execute(payload);

    if (!result.success) {
      setEditorState((currentState) => ({
        ...currentState,
        isSaving: false,
        errorMessage: result.error.message,
      }));
      return;
    }

    setEditorState(EMPTY_EDITOR_STATE);
    await loadBudgetData();
    setSuccessMessage(
      editorState.mode === "create" ? "Budget created." : "Budget updated.",
    );
  }, [
    accountRemoteId,
    createBudgetPlanUseCase,
    editorState.budgetMonth,
    editorState.categoryRemoteId,
    editorState.mode,
    editorState.note,
    editorState.plannedAmount,
    editorState.remoteId,
    expenseCategories,
    loadBudgetData,
    ownerUserRemoteId,
    resolvedCurrencyCode,
    updateBudgetPlanUseCase,
  ]);

  const onCloseDetail = useCallback(() => {
    setDetailState(null);
    setActiveDetailRemoteId(null);
    setDeleteConfirmationVisible(false);
    setPendingDeleteBudgetRemoteId(null);
    setDeleteErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  const onRequestDeleteBudget = useCallback(() => {
    if (!activeDetailRemoteId) {
      return;
    }

    setDeleteConfirmationVisible(true);
    setPendingDeleteBudgetRemoteId(activeDetailRemoteId);
    setDeleteErrorMessage(null);
  }, [activeDetailRemoteId]);

  const onCancelDeleteBudget = useCallback(() => {
    if (isDeleting) {
      return;
    }

    setDeleteConfirmationVisible(false);
    setPendingDeleteBudgetRemoteId(null);
    setDeleteErrorMessage(null);
  }, [isDeleting]);

  const onConfirmDeleteBudget = useCallback(async () => {
    if (!accountRemoteId || !pendingDeleteBudgetRemoteId) {
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMessage(null);
    setSuccessMessage(null);

    const result = await deleteBudgetPlanUseCase.execute({
      accountRemoteId,
      remoteId: pendingDeleteBudgetRemoteId,
    });

    setIsDeleting(false);

    if (!result.success) {
      setDeleteErrorMessage(result.error.message);
      return;
    }

    if (!result.value) {
      setDeleteErrorMessage("The requested budget was not found.");
      return;
    }

    setDeleteConfirmationVisible(false);
    setPendingDeleteBudgetRemoteId(null);
    setDeleteErrorMessage(null);
    setDetailState(null);
    setActiveDetailRemoteId(null);
    await loadBudgetData();
    setSuccessMessage("Budget deleted.");
  }, [
    accountRemoteId,
    deleteBudgetPlanUseCase,
    loadBudgetData,
    pendingDeleteBudgetRemoteId,
  ]);

  const onEditFromDetail = useCallback(async () => {
    if (!activeDetailRemoteId) {
      return;
    }

    const budgetRemoteId = activeDetailRemoteId;
    onCloseDetail();
    await Promise.resolve();
    await onOpenEdit(budgetRemoteId);
  }, [activeDetailRemoteId, onCloseDetail, onOpenEdit]);

  return useMemo<BudgetViewModel>(
    () => ({
      isLoading,
      errorMessage,
      successMessage,
      monthLabel,
      summaryCards,
      budgetItems,
      selectedFilter,
      searchQuery,
      emptyStateMessage,
      emptyStateActionLabel,
      categoryOptions,
      editorState,
      quickCategoryState,
      detailState,
      isDetailVisible: detailState !== null,
      deleteConfirmationVisible,
      deleteErrorMessage,
      isDeleting,
      canCreate: Boolean(ownerUserRemoteId && accountRemoteId),
      onRefresh: loadBudgetData,
      onChangeFilter: setSelectedFilter,
      onChangeSearchQuery: setSearchQuery,
      onPressEmptyStateAction,
      onOpenCreate,
      onOpenDetail,
      onOpenEdit,
      onCloseEditor,
      onEditorFieldChange,
      onQuickCategoryNameChange,
      onCreateQuickExpenseCategory,
      onSubmit,
      onCloseDetail,
      onRequestDeleteBudget,
      onCancelDeleteBudget,
      onConfirmDeleteBudget,
      onEditFromDetail,
    }),
    [
      accountRemoteId,
      budgetItems,
      categoryOptions,
      deleteConfirmationVisible,
      deleteErrorMessage,
      detailState,
      editorState,
      quickCategoryState,
      emptyStateActionLabel,
      emptyStateMessage,
      errorMessage,
      successMessage,
      isDeleting,
      isLoading,
      loadBudgetData,
      monthLabel,
      onCancelDeleteBudget,
      onCloseDetail,
      onCloseEditor,
      onConfirmDeleteBudget,
      onCreateQuickExpenseCategory,
      onEditFromDetail,
      onEditorFieldChange,
      onQuickCategoryNameChange,
      onOpenCreate,
      onOpenDetail,
      onOpenEdit,
      onPressEmptyStateAction,
      onRequestDeleteBudget,
      onSubmit,
      ownerUserRemoteId,
      searchQuery,
      selectedFilter,
      summaryCards,
    ],
  );
};
