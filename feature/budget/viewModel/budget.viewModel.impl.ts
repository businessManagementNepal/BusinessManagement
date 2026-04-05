import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { CategoryKind, Category } from "@/feature/categories/types/category.types";
import { GetCategoriesUseCase } from "@/feature/categories/useCase/getCategories.useCase";
import { Transaction, TransactionType } from "@/feature/transactions/types/transaction.entity.types";
import { GetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BudgetPlan,
} from "@/feature/budget/types/budget.types";
import { CreateBudgetPlanUseCase } from "@/feature/budget/useCase/createBudgetPlan.useCase";
import { DeleteBudgetPlanUseCase } from "@/feature/budget/useCase/deleteBudgetPlan.useCase";
import { GetBudgetPlanByRemoteIdUseCase } from "@/feature/budget/useCase/getBudgetPlanByRemoteId.useCase";
import { GetBudgetPlansUseCase } from "@/feature/budget/useCase/getBudgetPlans.useCase";
import { UpdateBudgetPlanUseCase } from "@/feature/budget/useCase/updateBudgetPlan.useCase";
import {
  BudgetDetailState,
  BudgetEditorState,
  BudgetListFilter,
  BudgetListFilterValue,
  BudgetListItemState,
  BudgetSummaryCardState,
  BudgetViewModel,
} from "./budget.viewModel";
import {
  formatCurrencyAmount,
  resolveCurrencyCode,
} from "@/shared/utils/currency/accountCurrency";

type UseBudgetViewModelParams = {
  ownerUserRemoteId: string | null;
  accountRemoteId: string | null;
  currencyCode: string | null;
  countryCode: string | null;
  getBudgetPlansUseCase: GetBudgetPlansUseCase;
  getBudgetPlanByRemoteIdUseCase: GetBudgetPlanByRemoteIdUseCase;
  createBudgetPlanUseCase: CreateBudgetPlanUseCase;
  updateBudgetPlanUseCase: UpdateBudgetPlanUseCase;
  deleteBudgetPlanUseCase: DeleteBudgetPlanUseCase;
  getCategoriesUseCase: GetCategoriesUseCase;
  getTransactionsUseCase: GetTransactionsUseCase;
};

const getCurrentBudgetMonth = (): string => new Date().toISOString().slice(0, 7);

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

const getTransactionBudgetMonth = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
};

const buildSpentLookup = (
  transactions: readonly Transaction[],
): Map<string, number> => {
  const lookup = new Map<string, number>();

  transactions.forEach((transaction) => {
    if (
      transaction.transactionType !== TransactionType.Expense ||
      !transaction.categoryLabel?.trim()
    ) {
      return;
    }

    const budgetMonth = getTransactionBudgetMonth(transaction.happenedAt);
    const key = `${budgetMonth}::${transaction.categoryLabel.trim().toLowerCase()}`;
    const currentAmount = lookup.get(key) ?? 0;
    lookup.set(key, currentAmount + transaction.amount);
  });

  return lookup;
};

const buildBudgetListItemState = (
  budgetPlan: BudgetPlan,
  currencyCode: string,
  countryCode: string | null,
  spentAmount: number,
): BudgetListItemState => {
  const remainingAmount = budgetPlan.plannedAmount - spentAmount;
  const isOverspent = remainingAmount < 0;
  const progressPercent = budgetPlan.plannedAmount <= 0
    ? 0
    : Math.max(0, Math.min(100, (spentAmount / budgetPlan.plannedAmount) * 100));

  return {
    remoteId: budgetPlan.remoteId,
    title: budgetPlan.categoryNameSnapshot,
    subtitle: `${formatBudgetMonth(budgetPlan.budgetMonth)} budget`,
    plannedAmountLabel: formatCurrencyAmount({
      amount: budgetPlan.plannedAmount,
      currencyCode,
      countryCode,
    }),
    spentAmountLabel: formatCurrencyAmount({
      amount: spentAmount,
      currencyCode,
      countryCode,
    }),
    remainingAmountLabel: formatCurrencyAmount({
      amount: Math.abs(remainingAmount),
      currencyCode,
      countryCode,
    }),
    monthLabel: formatBudgetMonth(budgetPlan.budgetMonth),
    noteLabel: budgetPlan.note?.trim() || null,
    progressPercent,
    isOverspent,
    statusLabel: isOverspent ? "OVER" : "ON TRACK",
  };
};

const buildDetailState = (
  budgetPlan: BudgetPlan,
  currencyCode: string,
  countryCode: string | null,
  spentAmount: number,
): BudgetDetailState => {
  const remainingAmount = budgetPlan.plannedAmount - spentAmount;
  const isOverspent = remainingAmount < 0;

  return {
    remoteId: budgetPlan.remoteId,
    title: budgetPlan.categoryNameSnapshot,
    subtitle: formatBudgetMonth(budgetPlan.budgetMonth),
    plannedAmountLabel: formatCurrencyAmount({
      amount: budgetPlan.plannedAmount,
      currencyCode,
      countryCode,
    }),
    spentAmountLabel: formatCurrencyAmount({
      amount: spentAmount,
      currencyCode,
      countryCode,
    }),
    remainingAmountLabel: formatCurrencyAmount({
      amount: Math.abs(remainingAmount),
      currencyCode,
      countryCode,
    }),
    statusLabel: isOverspent ? "Over budget" : "On track",
    noteLabel: budgetPlan.note?.trim() || null,
  };
};

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

export const useBudgetViewModel = ({
  ownerUserRemoteId,
  accountRemoteId,
  currencyCode,
  countryCode,
  getBudgetPlansUseCase,
  getBudgetPlanByRemoteIdUseCase,
  createBudgetPlanUseCase,
  updateBudgetPlanUseCase,
  deleteBudgetPlanUseCase,
  getCategoriesUseCase,
  getTransactionsUseCase,
}: UseBudgetViewModelParams): BudgetViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<BudgetListFilterValue>(
    BudgetListFilter.All,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [editorState, setEditorState] = useState<BudgetEditorState>(
    EMPTY_EDITOR_STATE,
  );
  const [detailState, setDetailState] = useState<BudgetDetailState | null>(null);
  const [activeDetailRemoteId, setActiveDetailRemoteId] = useState<string | null>(null);
  const resolvedCurrencyCode = useMemo(
    () => resolveCurrencyCode({ currencyCode, countryCode }),
    [countryCode, currencyCode],
  );

  const loadBudgetData = useCallback(async () => {
    if (!ownerUserRemoteId || !accountRemoteId) {
      setBudgetPlans([]);
      setExpenseCategories([]);
      setTransactions([]);
      setErrorMessage("A personal account is required to manage budgets.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [budgetPlansResult, categoriesResult, transactionsResult] = await Promise.all([
      getBudgetPlansUseCase.execute({ ownerUserRemoteId, accountRemoteId }),
      getCategoriesUseCase.execute({
        ownerUserRemoteId,
        accountRemoteId,
        accountType: AccountType.Personal,
      }),
      getTransactionsUseCase.execute({ ownerUserRemoteId, accountRemoteId }),
    ]);

    if (!budgetPlansResult.success) {
      setBudgetPlans([]);
      setExpenseCategories([]);
      setTransactions([]);
      setErrorMessage(budgetPlansResult.error.message);
      setIsLoading(false);
      return;
    }

    if (!categoriesResult.success) {
      setBudgetPlans([]);
      setExpenseCategories([]);
      setTransactions([]);
      setErrorMessage(categoriesResult.error.message);
      setIsLoading(false);
      return;
    }

    if (!transactionsResult.success) {
      setBudgetPlans([]);
      setExpenseCategories([]);
      setTransactions([]);
      setErrorMessage(transactionsResult.error.message);
      setIsLoading(false);
      return;
    }

    setBudgetPlans(budgetPlansResult.value);
    setExpenseCategories(
      categoriesResult.value.filter(
        (category) => category.kind === CategoryKind.Expense,
      ),
    );
    setTransactions(transactionsResult.value);
    setErrorMessage(null);
    setIsLoading(false);
  }, [
    accountRemoteId,
    getBudgetPlansUseCase,
    getCategoriesUseCase,
    getTransactionsUseCase,
    ownerUserRemoteId,
  ]);

  useEffect(() => {
    void loadBudgetData();
  }, [loadBudgetData]);

  const spentLookup = useMemo(
    () => buildSpentLookup(transactions),
    [transactions],
  );

  const budgetItems = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return budgetPlans
      .map((budgetPlan) => {
        const key = `${budgetPlan.budgetMonth}::${budgetPlan.categoryNameSnapshot
          .trim()
          .toLowerCase()}`;
        const spentAmount = spentLookup.get(key) ?? 0;
        return buildBudgetListItemState(
          budgetPlan,
          resolvedCurrencyCode,
          countryCode,
          spentAmount,
        );
      })
      .filter((budgetItem) => {
        const matchesSearch =
          normalizedSearchQuery.length === 0 ||
          budgetItem.title.toLowerCase().includes(normalizedSearchQuery) ||
          budgetItem.monthLabel.toLowerCase().includes(normalizedSearchQuery);

        if (!matchesSearch) {
          return false;
        }

        if (selectedFilter === BudgetListFilter.ThisMonth) {
          return budgetItem.monthLabel === formatBudgetMonth(getCurrentBudgetMonth());
        }

        if (selectedFilter === BudgetListFilter.Overspent) {
          return budgetItem.isOverspent;
        }

        return true;
      });
  }, [
    budgetPlans,
    countryCode,
    resolvedCurrencyCode,
    searchQuery,
    selectedFilter,
    spentLookup,
  ]);

  const summaryCards = useMemo<readonly BudgetSummaryCardState[]>(() => {
    const currentMonth = getCurrentBudgetMonth();
    let plannedAmount = 0;
    let spentAmount = 0;

    budgetPlans.forEach((budgetPlan) => {
      if (budgetPlan.budgetMonth !== currentMonth) {
        return;
      }

      plannedAmount += budgetPlan.plannedAmount;
      const key = `${budgetPlan.budgetMonth}::${budgetPlan.categoryNameSnapshot
        .trim()
        .toLowerCase()}`;
      spentAmount += spentLookup.get(key) ?? 0;
    });

    return [
      {
        id: "planned",
        label: "This Month Planned",
        value: formatCurrencyAmount({
          amount: plannedAmount,
          currencyCode: resolvedCurrencyCode,
          countryCode,
        }),
        tone: "neutral",
      },
      {
        id: "spent",
        label: "Spent This Month",
        value: formatCurrencyAmount({
          amount: spentAmount,
          currencyCode: resolvedCurrencyCode,
          countryCode,
        }),
        tone: spentAmount > plannedAmount ? "alert" : "neutral",
      },
    ] as const;
  }, [budgetPlans, countryCode, resolvedCurrencyCode, spentLookup]);

  const monthLabel = useMemo(
    () => formatBudgetMonth(getCurrentBudgetMonth()),
    [],
  );

  const emptyStateMessage = useMemo(() => {
    if (expenseCategories.length === 0) {
      return "Create at least one expense category before adding budgets.";
    }

    if (searchQuery.trim().length > 0 || selectedFilter !== BudgetListFilter.All) {
      return "No budget categories match your current search or filter.";
    }

    return "No budget categories added yet.";
  }, [expenseCategories.length, searchQuery, selectedFilter]);

  const categoryOptions = useMemo(
    () =>
      expenseCategories.map((category) => ({
        remoteId: category.remoteId,
        label: category.name,
        kind: category.kind,
      })),
    [expenseCategories],
  );

  const onOpenCreate = useCallback(() => {
    if (!ownerUserRemoteId || !accountRemoteId) {
      setErrorMessage("A personal account is required to manage budgets.");
      return;
    }

    if (categoryOptions.length === 0) {
      setErrorMessage("Create at least one expense category before adding budgets.");
      return;
    }

    setEditorState({
      ...EMPTY_EDITOR_STATE,
      visible: true,
      categoryRemoteId: categoryOptions[0]?.remoteId ?? "",
    });
    setErrorMessage(null);
  }, [accountRemoteId, categoryOptions, ownerUserRemoteId]);

  const onOpenDetail = useCallback(async (remoteId: string) => {
    const result = await getBudgetPlanByRemoteIdUseCase.execute(remoteId);

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    const key = `${result.value.budgetMonth}::${result.value.categoryNameSnapshot
      .trim()
      .toLowerCase()}`;
    const spentAmount = spentLookup.get(key) ?? 0;
    setDetailState(
      buildDetailState(result.value, resolvedCurrencyCode, countryCode, spentAmount),
    );
    setActiveDetailRemoteId(result.value.remoteId);
    setErrorMessage(null);
  }, [countryCode, getBudgetPlanByRemoteIdUseCase, resolvedCurrencyCode, spentLookup]);

  const onOpenEdit = useCallback(async (remoteId: string) => {
    const result = await getBudgetPlanByRemoteIdUseCase.execute(remoteId);

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    setEditorState(mapBudgetPlanToEditorState(result.value));
    setErrorMessage(null);
  }, [getBudgetPlanByRemoteIdUseCase]);

  const onCloseEditor = useCallback(() => {
    setEditorState(EMPTY_EDITOR_STATE);
  }, []);

  const onEditorFieldChange = useCallback(
    (
      field: "budgetMonth" | "categoryRemoteId" | "plannedAmount" | "note",
      value: string,
    ) => {
      setEditorState((currentState) => ({
        ...currentState,
        [field]: value,
        errorMessage: null,
      }));
    },
    [],
  );

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
        errorMessage: "Please choose an expense category.",
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
  }, []);

  const onDeleteActiveBudget = useCallback(async () => {
    if (!activeDetailRemoteId) {
      return;
    }

    const result = await deleteBudgetPlanUseCase.execute(activeDetailRemoteId);

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    onCloseDetail();
    await loadBudgetData();
  }, [activeDetailRemoteId, deleteBudgetPlanUseCase, loadBudgetData, onCloseDetail]);

  const onEditFromDetail = useCallback(async () => {
    if (!activeDetailRemoteId) {
      return;
    }

    onCloseDetail();
    await onOpenEdit(activeDetailRemoteId);
  }, [activeDetailRemoteId, onCloseDetail, onOpenEdit]);

  return useMemo<BudgetViewModel>(
    () => ({
      isLoading,
      errorMessage,
      monthLabel,
      summaryCards,
      budgetItems,
      selectedFilter,
      searchQuery,
      emptyStateMessage,
      categoryOptions,
      editorState,
      detailState,
      isDetailVisible: detailState !== null,
      canCreate: Boolean(ownerUserRemoteId && accountRemoteId && categoryOptions.length > 0),
      onRefresh: loadBudgetData,
      onChangeFilter: setSelectedFilter,
      onChangeSearchQuery: setSearchQuery,
      onOpenCreate,
      onOpenDetail,
      onOpenEdit,
      onCloseEditor,
      onEditorFieldChange,
      onSubmit,
      onCloseDetail,
      onDeleteActiveBudget,
      onEditFromDetail,
    }),
    [
      accountRemoteId,
      budgetItems,
      categoryOptions,
      detailState,
      editorState,
      emptyStateMessage,
      errorMessage,
      isLoading,
      loadBudgetData,
      monthLabel,
      onCloseDetail,
      onCloseEditor,
      onDeleteActiveBudget,
      onEditFromDetail,
      onOpenCreate,
      onOpenDetail,
      onOpenEdit,
      onEditorFieldChange,
      onSubmit,
      ownerUserRemoteId,
      searchQuery,
      selectedFilter,
      summaryCards,
    ],
  );
};
