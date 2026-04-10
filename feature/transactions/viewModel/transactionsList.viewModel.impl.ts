import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Transaction,
  TransactionDirection,
  TransactionPostingStatus,
  TransactionSourceModule,
  TransactionSourceModuleValue,
  TransactionType,
  TransactionTypeValue,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  TransactionDateFilter,
  TransactionDateFilterValue,
  TransactionFilterOption,
  TransactionListFilter,
  TransactionListFilterValue,
  TransactionListItemState,
  TransactionMetaChipState,
  TransactionPostingFilter,
  TransactionPostingFilterValue,
  TransactionSourceFilter,
  TransactionSourceFilterValue,
  TransactionSummaryCardState,
} from "@/feature/transactions/types/transaction.state.types";
import { GetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase";
import { TransactionsListViewModel } from "./transactionsList.viewModel";
import {
  formatCurrencyAmount,
  resolveCurrencyCode,
} from "@/shared/utils/currency/accountCurrency";

const MONEY_ACCOUNT_FILTER_ALL = "all";

const SOURCE_FILTER_OPTIONS: readonly {
  label: string;
  value: TransactionSourceFilterValue;
}[] = [
  { label: "All Sources", value: TransactionSourceFilter.All },
  { label: "Ledger", value: TransactionSourceFilter.Ledger },
  { label: "Billing", value: TransactionSourceFilter.Billing },
  { label: "POS", value: TransactionSourceFilter.Pos },
  { label: "Manual", value: TransactionSourceFilter.Manual },
  { label: "EMI", value: TransactionSourceFilter.Emi },
  { label: "Orders", value: TransactionSourceFilter.Orders },
];

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

const POSTING_FILTER_OPTIONS: readonly {
  label: string;
  value: TransactionPostingFilterValue;
}[] = [
  { label: "All Status", value: TransactionPostingFilter.All },
  { label: "Posted", value: TransactionPostingFilter.Posted },
  { label: "Voided", value: TransactionPostingFilter.Voided },
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

const getTransactionTypeLabel = (transactionType: TransactionTypeValue): string => {
  switch (transactionType) {
    case TransactionType.Income:
      return "Income";
    case TransactionType.Expense:
      return "Expense";
    case TransactionType.Transfer:
      return "Transfer";
    case TransactionType.Refund:
      return "Refund";
    default:
      return "Transaction";
  }
};

const normalizeSourceModule = (transaction: Transaction): TransactionSourceModuleValue => {
  return transaction.sourceModule ?? TransactionSourceModule.Manual;
};

const getSourceLabel = (sourceModule: TransactionSourceModuleValue): string => {
  switch (sourceModule) {
    case TransactionSourceModule.Ledger:
      return "Ledger";
    case TransactionSourceModule.Billing:
      return "Billing";
    case TransactionSourceModule.Pos:
      return "POS";
    case TransactionSourceModule.Emi:
      return "EMI";
    case TransactionSourceModule.Orders:
      return "Orders";
    default:
      return "Manual";
  }
};

const getPartyLabel = (transaction: Transaction): string | null => {
  const normalizedTitle = transaction.title.trim();
  if (!normalizedTitle) {
    return null;
  }

  const patterns = [
    /received\s+from\s+(.+)$/i,
    /paid\s+to\s+(.+)$/i,
    /sale\s+due\s*-\s*(.+)$/i,
    /purchase\s+due\s*-\s*(.+)$/i,
    /receive\s+money\s*-\s*(.+)$/i,
    /pay\s+money\s*-\s*(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = normalizedTitle.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
};

const buildSubtitle = (transaction: Transaction): string => {
  const dateLabel = formatTransactionDate(transaction.happenedAt);
  const typeLabel = getTransactionTypeLabel(transaction.transactionType);
  const accountLabel = transaction.accountDisplayNameSnapshot || "Account";

  return `${dateLabel} - ${typeLabel} - ${accountLabel}`;
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

  return transaction.direction === TransactionDirection.In
    ? `+${amountLabel}`
    : `-${amountLabel}`;
};

const resolveMoneyAccountFilterKey = (transaction: Transaction): string | null => {
  const remoteId = transaction.settlementMoneyAccountRemoteId?.trim() ?? "";
  if (remoteId.length > 0) {
    return `id:${remoteId}`;
  }

  const displayName =
    transaction.settlementMoneyAccountDisplayNameSnapshot?.trim() ?? "";
  if (displayName.length > 0) {
    return `name:${displayName.toLowerCase()}`;
  }

  return null;
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
  const [selectedSourceFilter, setSelectedSourceFilter] =
    useState<TransactionSourceFilterValue>(TransactionSourceFilter.All);
  const [selectedDateFilter, setSelectedDateFilter] =
    useState<TransactionDateFilterValue>(TransactionDateFilter.All);
  const [selectedPostingFilter, setSelectedPostingFilter] =
    useState<TransactionPostingFilterValue>(TransactionPostingFilter.All);
  const [selectedMoneyAccountFilter, setSelectedMoneyAccountFilter] =
    useState<string>(MONEY_ACCOUNT_FILTER_ALL);

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

  const moneyAccountFilterOptions = useMemo<readonly TransactionFilterOption[]>(() => {
    const optionByValue = new Map<string, TransactionFilterOption>();

    optionByValue.set(MONEY_ACCOUNT_FILTER_ALL, {
      value: MONEY_ACCOUNT_FILTER_ALL,
      label: "All Money Accounts",
    });

    for (const transaction of transactions) {
      const key = resolveMoneyAccountFilterKey(transaction);
      if (!key) {
        continue;
      }

      const displayLabel =
        transaction.settlementMoneyAccountDisplayNameSnapshot?.trim() ||
        "Money Account";

      if (!optionByValue.has(key)) {
        optionByValue.set(key, {
          value: key,
          label: displayLabel,
        });
      }
    }

    return Array.from(optionByValue.values());
  }, [transactions]);

  useEffect(() => {
    const hasSelectedOption = moneyAccountFilterOptions.some(
      (option) => option.value === selectedMoneyAccountFilter,
    );
    if (!hasSelectedOption) {
      setSelectedMoneyAccountFilter(MONEY_ACCOUNT_FILTER_ALL);
    }
  }, [moneyAccountFilterOptions, selectedMoneyAccountFilter]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const normalizedSourceModule = normalizeSourceModule(transaction);
      const sourceLabel = getSourceLabel(normalizedSourceModule).toLowerCase();
      const partyLabel = getPartyLabel(transaction)?.toLowerCase() ?? "";
      const moneyAccountLabel =
        transaction.settlementMoneyAccountDisplayNameSnapshot?.toLowerCase() ?? "";
      const accountLabel = transaction.accountDisplayNameSnapshot.toLowerCase();
      const statusLabel = transaction.postingStatus.toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        transaction.title.toLowerCase().includes(normalizedSearch) ||
        (transaction.note ?? "").toLowerCase().includes(normalizedSearch) ||
        (transaction.categoryLabel ?? "").toLowerCase().includes(normalizedSearch) ||
        sourceLabel.includes(normalizedSearch) ||
        partyLabel.includes(normalizedSearch) ||
        moneyAccountLabel.includes(normalizedSearch) ||
        accountLabel.includes(normalizedSearch) ||
        statusLabel.includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      if (selectedSourceFilter !== TransactionSourceFilter.All) {
        if (normalizedSourceModule !== selectedSourceFilter) {
          return false;
        }
      }

      if (selectedPostingFilter !== TransactionPostingFilter.All) {
        if (transaction.postingStatus !== selectedPostingFilter) {
          return false;
        }
      }

      if (!matchesDateFilter(transaction.happenedAt, selectedDateFilter)) {
        return false;
      }

      if (selectedMoneyAccountFilter !== MONEY_ACCOUNT_FILTER_ALL) {
        if (resolveMoneyAccountFilterKey(transaction) !== selectedMoneyAccountFilter) {
          return false;
        }
      }

      switch (selectedFilter) {
        case TransactionListFilter.Income:
          return (
            transaction.transactionType === TransactionType.Income ||
            (transaction.transactionType === TransactionType.Refund &&
              transaction.direction === TransactionDirection.In)
          );
        case TransactionListFilter.Expense:
          return (
            transaction.transactionType === TransactionType.Expense ||
            (transaction.transactionType === TransactionType.Refund &&
              transaction.direction === TransactionDirection.Out)
          );
        case TransactionListFilter.Transfer:
          return transaction.transactionType === TransactionType.Transfer;
        default:
          return true;
      }
    });
  }, [
    searchQuery,
    selectedFilter,
    selectedSourceFilter,
    selectedDateFilter,
    selectedPostingFilter,
    selectedMoneyAccountFilter,
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
      const normalizedSource = normalizeSourceModule(transaction);
      const sourceLabel = getSourceLabel(normalizedSource);
      const moneyAccountLabel =
        transaction.settlementMoneyAccountDisplayNameSnapshot?.trim() ?? null;
      const partyLabel = getPartyLabel(transaction);

      const metaChips: TransactionMetaChipState[] = [
        { label: sourceLabel, tone: "neutral" },
      ];

      if (moneyAccountLabel) {
        metaChips.push({ label: moneyAccountLabel, tone: "neutral" });
      }

      metaChips.push({
        label:
          transaction.postingStatus === TransactionPostingStatus.Voided
            ? "Voided"
            : "Posted",
        tone:
          transaction.postingStatus === TransactionPostingStatus.Voided
            ? "danger"
            : "success",
      });

      return {
        remoteId: transaction.remoteId,
        title: transaction.title,
        partyLabel,
        subtitle: buildSubtitle(transaction),
        amountLabel: buildAmountLabel(
          transaction,
          resolvedCurrencyCode,
          activeAccountCountryCode,
        ),
        tone:
          transaction.direction === TransactionDirection.In ? "income" : "expense",
        transactionType: transaction.transactionType,
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

  const handleChangeSourceFilter = useCallback(
    (filter: TransactionSourceFilterValue) => {
      setSelectedSourceFilter(filter);
    },
    [],
  );

  const handleChangeDateFilter = useCallback(
    (filter: TransactionDateFilterValue) => {
      setSelectedDateFilter(filter);
    },
    [],
  );

  const handleChangePostingFilter = useCallback(
    (filter: TransactionPostingFilterValue) => {
      setSelectedPostingFilter(filter);
    },
    [],
  );

  const handleChangeMoneyAccountFilter = useCallback((value: string) => {
    setSelectedMoneyAccountFilter(value);
  }, []);

  return useMemo(
    () => ({
      isLoading,
      errorMessage,
      searchQuery,
      selectedFilter,
      selectedSourceFilter,
      selectedDateFilter,
      selectedPostingFilter,
      selectedMoneyAccountFilter,
      sourceFilterOptions: SOURCE_FILTER_OPTIONS,
      dateFilterOptions: DATE_FILTER_OPTIONS,
      postingFilterOptions: POSTING_FILTER_OPTIONS,
      moneyAccountFilterOptions,
      summaryCards,
      transactionItems,
      emptyStateMessage,
      refresh: loadTransactions,
      onChangeSearchQuery: handleChangeSearchQuery,
      onChangeFilter: handleChangeFilter,
      onChangeSourceFilter: handleChangeSourceFilter,
      onChangeDateFilter: handleChangeDateFilter,
      onChangePostingFilter: handleChangePostingFilter,
      onChangeMoneyAccountFilter: handleChangeMoneyAccountFilter,
      onOpenCreate,
      onOpenEdit,
    }),
    [
      emptyStateMessage,
      errorMessage,
      handleChangeDateFilter,
      handleChangeFilter,
      handleChangeMoneyAccountFilter,
      handleChangePostingFilter,
      handleChangeSearchQuery,
      handleChangeSourceFilter,
      isLoading,
      loadTransactions,
      moneyAccountFilterOptions,
      onOpenCreate,
      onOpenEdit,
      searchQuery,
      selectedDateFilter,
      selectedFilter,
      selectedMoneyAccountFilter,
      selectedPostingFilter,
      selectedSourceFilter,
      summaryCards,
      transactionItems,
    ],
  );
};
