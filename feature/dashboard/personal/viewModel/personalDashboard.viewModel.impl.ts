import {
  Transaction,
  TransactionDirection,
} from "@/feature/transactions/types/transaction.entity.types";
import { GetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PersonalDashboardQuickAction,
  PersonalDashboardRecentItem,
  PersonalDashboardSummaryCard,
} from "../types/personalDashboard.types";
import { PersonalDashboardViewModel } from "./personalDashboard.viewModel";

const quickActions: readonly PersonalDashboardQuickAction[] = [
  { id: "transactions", label: "Transactions" },
  { id: "emi", label: "EMI & Loans" },
  { id: "reports", label: "Reports" },
  { id: "budget", label: "Budget" },
];

type UsePersonalDashboardViewModelParams = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  getTransactionsUseCase: GetTransactionsUseCase;
};

const formatRecentItemSubtitle = (happenedAt: number): string => {
  const date = new Date(happenedAt);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) {
    return `Today, ${date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  if (date >= startOfYesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const usePersonalDashboardViewModel = ({
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  getTransactionsUseCase,
}: UsePersonalDashboardViewModelParams): PersonalDashboardViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<readonly Transaction[]>([]);

  const loadTransactions = useCallback(async (): Promise<void> => {
    if (!activeUserRemoteId || !activeAccountRemoteId) {
      setTransactions([]);
      setErrorMessage("Active account context is required.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const result = await getTransactionsUseCase.execute({
      ownerUserRemoteId: activeUserRemoteId,
      accountRemoteId: activeAccountRemoteId,
    });

    if (!result.success) {
      setTransactions([]);
      setErrorMessage(result.error.message);
      setIsLoading(false);
      return;
    }

    setTransactions(result.value);
    setErrorMessage(null);
    setIsLoading(false);
  }, [activeAccountRemoteId, activeUserRemoteId, getTransactionsUseCase]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const currencyCode = activeAccountCurrencyCode;
  const countryCode = activeAccountCountryCode;

  const monthlyIncome = useMemo(
    () => {
      const now = new Date();
      const startOfMonthTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).getTime();

      return transactions.reduce((sum, transaction) => {
        const isCurrentMonth = transaction.happenedAt >= startOfMonthTime;

        if (!isCurrentMonth || transaction.direction !== TransactionDirection.In) {
          return sum;
        }

        return sum + transaction.amount;
      }, 0);
    },
    [transactions],
  );

  const monthlyExpense = useMemo(
    () => {
      const now = new Date();
      const startOfMonthTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).getTime();

      return transactions.reduce((sum, transaction) => {
        const isCurrentMonth = transaction.happenedAt >= startOfMonthTime;

        if (!isCurrentMonth || transaction.direction !== TransactionDirection.Out) {
          return sum;
        }

        return sum + transaction.amount;
      }, 0);
    },
    [transactions],
  );

  const todayInAmount = useMemo(
    () => {
      const now = new Date();
      const startOfTodayTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).getTime();
      const endOfTodayTime = startOfTodayTime + 24 * 60 * 60 * 1000;

      return transactions.reduce((sum, transaction) => {
        const isToday =
          transaction.happenedAt >= startOfTodayTime &&
          transaction.happenedAt < endOfTodayTime;

        if (!isToday || transaction.direction !== TransactionDirection.In) {
          return sum;
        }

        return sum + transaction.amount;
      }, 0);
    },
    [transactions],
  );

  const todayOutAmount = useMemo(
    () => {
      const now = new Date();
      const startOfTodayTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).getTime();
      const endOfTodayTime = startOfTodayTime + 24 * 60 * 60 * 1000;

      return transactions.reduce((sum, transaction) => {
        const isToday =
          transaction.happenedAt >= startOfTodayTime &&
          transaction.happenedAt < endOfTodayTime;

        if (!isToday || transaction.direction !== TransactionDirection.Out) {
          return sum;
        }

        return sum + transaction.amount;
      }, 0);
    },
    [transactions],
  );

  const netAmount = monthlyIncome - monthlyExpense;

  const summaryCards = useMemo<readonly PersonalDashboardSummaryCard[]>(() => {
    return [
      {
        id: "total-income",
        title: "Monthly Income",
        value: formatCurrencyAmount({
          amount: monthlyIncome,
          currencyCode,
          countryCode,
        }),
        tone: "income",
      },
      {
        id: "total-expense",
        title: "Monthly Expense",
        value: formatCurrencyAmount({
          amount: monthlyExpense,
          currencyCode,
          countryCode,
        }),
        tone: "expense",
      },
      {
        id: "net-balance",
        title: "Net Balance",
        value: formatCurrencyAmount({
          amount: netAmount,
          currencyCode,
          countryCode,
        }),
        tone: "neutral",
      },
    ];
  }, [countryCode, currencyCode, monthlyExpense, monthlyIncome, netAmount]);

  const recentItems = useMemo<readonly PersonalDashboardRecentItem[]>(() => {
    return transactions.slice(0, 6).map((transaction) => {
      const isIncome = transaction.direction === TransactionDirection.In;
      const amountLabel = formatCurrencyAmount({
        amount: transaction.amount,
        currencyCode,
        countryCode,
      });

      return {
        id: transaction.remoteId,
        title: transaction.title,
        subtitle: formatRecentItemSubtitle(transaction.happenedAt),
        amount: `${isIncome ? "+" : "-"} ${amountLabel}`,
        tone: isIncome ? "income" : "expense",
      };
    });
  }, [countryCode, currencyCode, transactions]);

  const todayInValue = useMemo(
    () =>
      formatCurrencyAmount({
        amount: todayInAmount,
        currencyCode,
        countryCode,
      }),
    [countryCode, currencyCode, todayInAmount],
  );

  const todayOutValue = useMemo(
    () =>
      formatCurrencyAmount({
        amount: todayOutAmount,
        currencyCode,
        countryCode,
      }),
    [countryCode, currencyCode, todayOutAmount],
  );

  const netValue = useMemo(
    () =>
      formatCurrencyAmount({
        amount: netAmount,
        currencyCode,
        countryCode,
      }),
    [countryCode, currencyCode, netAmount],
  );

  return useMemo<PersonalDashboardViewModel>(
    () => ({
      isLoading,
      errorMessage,
      summaryCards,
      quickActions,
      todayInValue,
      todayOutValue,
      netValue,
      recentItems,
    }),
    [
      errorMessage,
      isLoading,
      netValue,
      recentItems,
      summaryCards,
      todayInValue,
      todayOutValue,
    ],
  );
};
