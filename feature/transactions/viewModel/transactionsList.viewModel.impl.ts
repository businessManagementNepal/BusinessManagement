import {
  Transaction,
  TransactionDirection,
  TransactionType,
  TransactionTypeValue,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  TransactionDateFilter,
  TransactionDateFilterValue,
  TransactionListFilter,
  TransactionListFilterValue,
  TransactionListItemState,
  TransactionMetaChipState,
  TransactionSummaryCardState,
} from "@/feature/transactions/types/transaction.state.types";
import { GetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase";
import {
  formatCurrencyAmount,
  resolveCurrencyCode,
} from "@/shared/utils/currency/accountCurrency";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getTransactionActionLabel,
  getTransactionStatementLabel,
} from "./transactionAuditDisplay.util";
import { TransactionsListViewModel } from "./transactionsList.viewModel";

const DATE_FILTER_OPTIONS: readonly {
  label: string;
  value: TransactionDateFilterValue;
}[] = [
  { label: "All Time", value: TransactionDateFilter.All },
  { label: "Today", value: TransactionDateFilter.Today },
  { label: "Last 7 Days", value: TransactionDateFilter.Last7Days },
  { label: "Last 30 Days", value: TransactionDateFilter.Last30Days },
  { label: "This Month", value: TransactionDateFilter.ThisMonth },
];

const getStartOfDay = (timestamp: number): number => {
  const value = new Date(timestamp);
  value.setHours(0, 0, 0, 0);
  return value.getTime();
};

const formatTransactionDate = (happenedAt: number): string => {
  const date = new Date(happenedAt);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const buildSubtitle = (transaction: Transaction): string => {
  const dateLabel = formatTransactionDate(transaction.happenedAt);
  const statementLabel = getTransactionStatementLabel(transaction);
  const accountLabel = transaction.accountDisplayNameSnapshot || "Account";

  return `${dateLabel} - ${statementLabel} - ${accountLabel}`;
};

const buildAmountLabel = (
  transaction: Transaction,
  fallbackCurrencyCode: string,
  fallbackCountryCode: string | null,
): string => {
  const amountLabel = formatCurrencyAmount({
    amount: transaction.amount,
    currencyCode: transaction.currencyCode ?? fallbackCurrencyCode,
    countryCode: fallbackCountryCode,
  });

  const signedAmount = transaction.direction === TransactionDirection.In
    ? `+${amountLabel}`
    : `-${amountLabel}`;

  return signedAmount;
};

const matchesDateFilter = (
  happenedAt: number,
  selectedDateFilter: TransactionDateFilterValue,
): boolean => {
  if (selectedDateFilter === TransactionDateFilter.All) {
    return true;
  }

  const now = Date.now();
  const todayStart = getStartOfDay(now);
  const transactionDate = getStartOfDay(happenedAt);

  if (selectedDateFilter === TransactionDateFilter.Today) {
    return transactionDate === todayStart;
  }

  if (selectedDateFilter === TransactionDateFilter.Last7Days) {
    return transactionDate >= todayStart - 6 * 24 * 60 * 60 * 1000;
  }

  if (selectedDateFilter === TransactionDateFilter.Last30Days) {
    return transactionDate >= todayStart - 29 * 24 * 60 * 60 * 1000;
  }

  const nowDate = new Date(now);
  const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime();
  return transactionDate >= monthStart;
};

type UseTransactionsListViewModelParams = {
  ownerUserRemoteId: string;
  activeAccountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  getTransactionsUseCase: GetTransactionsUseCase;
  onOpenCreate: (type: TransactionTypeValue) => void;
  onOpenEdit: (remoteId: string) => void;
  reloadSignal: number;
};

export const useTransactionsListViewModel = ({
  ownerUserRemoteId,
  activeAccountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  getTransactionsUseCase,
  onOpenCreate,
  onOpenEdit,
  reloadSignal,
}: UseTransactionsListViewModelParams): TransactionsListViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<readonly Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<TransactionListFilterValue>(
    TransactionListFilter.All,
  );
  const [selectedDateFilter, setSelectedDateFilter] =
    useState<TransactionDateFilterValue>(TransactionDateFilter.All);

  const resolvedCurrencyCode = useMemo(
    () =>
      resolveCurrencyCode({
        currencyCode: activeAccountCurrencyCode,
        countryCode: activeAccountCountryCode,
      }),
    [activeAccountCountryCode, activeAccountCurrencyCode],
  );

  const loadTransactions = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const result = await getTransactionsUseCase.execute({
      ownerUserRemoteId,
      accountRemoteId: activeAccountRemoteId,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setTransactions(result.value);
    setErrorMessage(null);
    setIsLoading(false);
  }, [activeAccountRemoteId, getTransactionsUseCase, ownerUserRemoteId]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions, reloadSignal]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const accountLabel = transaction.accountDisplayNameSnapshot.toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        transaction.title.toLowerCase().includes(normalizedSearch) ||
        (transaction.note ?? "").toLowerCase().includes(normalizedSearch) ||
        (transaction.categoryLabel ?? "").toLowerCase().includes(normalizedSearch) ||
        accountLabel.includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      if (!matchesDateFilter(transaction.happenedAt, selectedDateFilter)) {
        return false;
      }

      switch (selectedFilter) {
        case TransactionListFilter.Income:
          return transaction.transactionType === TransactionType.Income;
        case TransactionListFilter.Expense:
          return transaction.transactionType === TransactionType.Expense;
        case TransactionListFilter.Transfer:
          return transaction.transactionType === TransactionType.Transfer;
        default:
          return true;
      }
    });
  }, [
    searchQuery,
    selectedFilter,
    selectedDateFilter,
    transactions,
  ]);

  const summaryCards = useMemo<readonly TransactionSummaryCardState[]>(() => {
    const moneyIn = filteredTransactions.reduce((sum, transaction) => {
      return transaction.direction === TransactionDirection.In
        ? sum + transaction.amount
        : sum;
    }, 0);

    const moneyOut = filteredTransactions.reduce((sum, transaction) => {
      return transaction.direction === TransactionDirection.Out
        ? sum + transaction.amount
        : sum;
    }, 0);

    const netAmount = moneyIn - moneyOut;
    const currencyCode =
      filteredTransactions[0]?.currencyCode ??
      transactions[0]?.currencyCode ??
      resolvedCurrencyCode;

    return [
      {
        id: "money-in",
        label: "Money In",
        value: formatCurrencyAmount({
          amount: moneyIn,
          currencyCode,
          countryCode: activeAccountCountryCode,
        }),
        tone: "income",
      },
      {
        id: "money-out",
        label: "Money Out",
        value: formatCurrencyAmount({
          amount: moneyOut,
          currencyCode,
          countryCode: activeAccountCountryCode,
        }),
        tone: "expense",
      },
      {
        id: "net-flow",
        label: "Net",
        value: formatCurrencyAmount({
          amount: netAmount,
          currencyCode,
          countryCode: activeAccountCountryCode,
        }),
        tone: "neutral",
      },
    ];
  }, [
    activeAccountCountryCode,
    filteredTransactions,
    resolvedCurrencyCode,
    transactions,
  ]);

  const transactionItems = useMemo<readonly TransactionListItemState[]>(() => {
    return filteredTransactions.map((transaction) => {
      const actionLabel = getTransactionActionLabel(transaction);
      const moneyAccountLabel =
        transaction.settlementMoneyAccountDisplayNameSnapshot?.trim() ?? null;
      const isVoided = false;

      const metaChips: TransactionMetaChipState[] = [];

      if (actionLabel) {
        metaChips.push({
          label: actionLabel,
          tone: "neutral",
        });
      }

      if (moneyAccountLabel) {
        metaChips.push({ label: moneyAccountLabel, tone: "neutral" });
      }

      return {
        remoteId: transaction.remoteId,
        title: transaction.title,
        partyLabel: null,
        subtitle: buildSubtitle(transaction),
        amountLabel: buildAmountLabel(
          transaction,
          resolvedCurrencyCode,
          activeAccountCountryCode,
        ),
        tone:
          transaction.direction === TransactionDirection.In ? "income" : "expense",
        transactionType: transaction.transactionType,
        isVoided,
        metaChips,
      };
    });
  }, [activeAccountCountryCode, filteredTransactions, resolvedCurrencyCode]);

  const emptyStateMessage = useMemo(() => {
    if (transactions.length === 0) {
      return "No transactions yet. Add your first entry to start tracking money.";
    }

    return "No transactions match your current filters.";
  }, [transactions.length]);

  const handleChangeSearchQuery = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleChangeFilter = useCallback((filter: TransactionListFilterValue) => {
    setSelectedFilter(filter);
  }, []);

  const handleChangeDateFilter = useCallback(
    (filter: TransactionDateFilterValue) => {
      setSelectedDateFilter(filter);
    },
    [],
  );

  return useMemo(
    () => ({
      isLoading,
      errorMessage,
      searchQuery,
      selectedFilter,
      selectedDateFilter,
      dateFilterOptions: DATE_FILTER_OPTIONS,
      summaryCards,
      transactionItems,
      emptyStateMessage,
      refresh: loadTransactions,
      onChangeSearchQuery: handleChangeSearchQuery,
      onChangeFilter: handleChangeFilter,
      onChangeDateFilter: handleChangeDateFilter,
      onOpenCreate,
      onOpenEdit,
    }),
    [
      emptyStateMessage,
      errorMessage,
      handleChangeDateFilter,
      handleChangeFilter,
      handleChangeSearchQuery,
      isLoading,
      loadTransactions,
      onOpenCreate,
      onOpenEdit,
      searchQuery,
      selectedDateFilter,
      selectedFilter,
      summaryCards,
      transactionItems,
    ],
  );
};
