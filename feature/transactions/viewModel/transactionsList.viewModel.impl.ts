import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Transaction,
  TransactionDirection,
  TransactionType,
  TransactionTypeValue,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  TransactionListFilter,
  TransactionListFilterValue,
  TransactionListItemState,
  TransactionSummaryCardState,
} from "@/feature/transactions/types/transaction.state.types";
import { GetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase";
import { TransactionsListViewModel } from "./transactionsList.viewModel";
import {
  formatCurrencyAmount,
  resolveCurrencyCode,
} from "@/shared/utils/currency/accountCurrency";

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
  const typeLabel = getTransactionTypeLabel(transaction.transactionType);

  if (transaction.transactionType === TransactionType.Transfer) {
    const directionLabel =
      transaction.direction === TransactionDirection.In ? "Money In" : "Money Out";

    return `${dateLabel} - ${directionLabel} - ${transaction.accountDisplayNameSnapshot}`;
  }

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
      const matchesSearch =
        normalizedSearch.length === 0 ||
        transaction.title.toLowerCase().includes(normalizedSearch) ||
        (transaction.note ?? "").toLowerCase().includes(normalizedSearch) ||
        (transaction.categoryLabel ?? "").toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
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
  }, [searchQuery, selectedFilter, transactions]);

  const summaryCards = useMemo<readonly TransactionSummaryCardState[]>(() => {
    const moneyIn = transactions.reduce((sum, transaction) => {
      return transaction.direction === TransactionDirection.In
        ? sum + transaction.amount
        : sum;
    }, 0);

    const moneyOut = transactions.reduce((sum, transaction) => {
      return transaction.direction === TransactionDirection.Out
        ? sum + transaction.amount
        : sum;
    }, 0);

    const currencyCode = transactions[0]?.currencyCode ?? resolvedCurrencyCode;

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
    ];
  }, [activeAccountCountryCode, resolvedCurrencyCode, transactions]);

  const transactionItems = useMemo<readonly TransactionListItemState[]>(() => {
    return filteredTransactions.map((transaction) => ({
      remoteId: transaction.remoteId,
      title: transaction.title,
      subtitle: buildSubtitle(transaction),
      amountLabel: buildAmountLabel(
        transaction,
        resolvedCurrencyCode,
        activeAccountCountryCode,
      ),
      tone:
        transaction.direction === TransactionDirection.In ? "income" : "expense",
      transactionType: transaction.transactionType,
    }));
  }, [activeAccountCountryCode, filteredTransactions, resolvedCurrencyCode]);

  const emptyStateMessage = useMemo(() => {
    if (transactions.length === 0) {
      return "No transactions yet. Add your first entry to start tracking money.";
    }

    return "No transactions match your current search or filter.";
  }, [transactions.length]);

  const handleChangeSearchQuery = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleChangeFilter = useCallback((filter: TransactionListFilterValue) => {
    setSelectedFilter(filter);
  }, []);

  return useMemo(
    () => ({
      isLoading,
      errorMessage,
      searchQuery,
      selectedFilter,
      summaryCards,
      transactionItems,
      emptyStateMessage,
      refresh: loadTransactions,
      onChangeSearchQuery: handleChangeSearchQuery,
      onChangeFilter: handleChangeFilter,
      onOpenCreate,
      onOpenEdit,
    }),
    [
      emptyStateMessage,
      errorMessage,
      handleChangeFilter,
      handleChangeSearchQuery,
      isLoading,
      loadTransactions,
      onOpenCreate,
      onOpenEdit,
      searchQuery,
      selectedFilter,
      summaryCards,
      transactionItems,
    ],
  );
};

