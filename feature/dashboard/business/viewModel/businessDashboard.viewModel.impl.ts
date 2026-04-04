import {
  Transaction,
  TransactionDirection,
} from "@/feature/transactions/types/transaction.entity.types";
import { GetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase";
import { LedgerEntry } from "@/feature/ledger/types/ledger.entity.types";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { buildLedgerPartyBalances } from "@/feature/ledger/viewModel/ledger.shared";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BusinessDashboardDueItem,
  BusinessDashboardQuickAction,
  BusinessDashboardSummaryCard,
} from "../types/businessDashboard.types";
import { BusinessDashboardViewModel } from "./businessDashboard.viewModel";

const quickActions: readonly BusinessDashboardQuickAction[] = [
  { id: "products", label: "Products" },
  { id: "billing", label: "Billing" },
  { id: "contacts", label: "Contacts" },
  { id: "transactions", label: "Txns" },
];

type UseBusinessDashboardViewModelParams = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  getTransactionsUseCase: GetTransactionsUseCase;
  getLedgerEntriesUseCase: GetLedgerEntriesUseCase;
};

export const useBusinessDashboardViewModel = ({
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  getTransactionsUseCase,
  getLedgerEntriesUseCase,
}: UseBusinessDashboardViewModelParams): BusinessDashboardViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<readonly Transaction[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<readonly LedgerEntry[]>([]);

  const loadDashboard = useCallback(async (): Promise<void> => {
    if (!activeUserRemoteId || !activeAccountRemoteId) {
      setTransactions([]);
      setLedgerEntries([]);
      setErrorMessage("Active account context is required.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [transactionResult, ledgerResult] = await Promise.all([
      getTransactionsUseCase.execute({
        ownerUserRemoteId: activeUserRemoteId,
        accountRemoteId: activeAccountRemoteId,
      }),
      getLedgerEntriesUseCase.execute({
        businessAccountRemoteId: activeAccountRemoteId,
      }),
    ]);

    if (transactionResult.success) {
      setTransactions(transactionResult.value);
    } else {
      setTransactions([]);
    }

    if (ledgerResult.success) {
      setLedgerEntries(ledgerResult.value);
    } else {
      setLedgerEntries([]);
    }

    if (!transactionResult.success && !ledgerResult.success) {
      setErrorMessage(
        `${transactionResult.error.message} ${ledgerResult.error.message}`.trim(),
      );
    } else if (!transactionResult.success) {
      setErrorMessage(transactionResult.error.message);
    } else if (!ledgerResult.success) {
      setErrorMessage(ledgerResult.error.message);
    } else {
      setErrorMessage(null);
    }

    setIsLoading(false);
  }, [
    activeAccountRemoteId,
    activeUserRemoteId,
    getLedgerEntriesUseCase,
    getTransactionsUseCase,
  ]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const currencyCode = activeAccountCurrencyCode;
  const countryCode = activeAccountCountryCode;

  const partyBalances = useMemo(
    () => buildLedgerPartyBalances(ledgerEntries),
    [ledgerEntries],
  );

  const summaryCards = useMemo<readonly BusinessDashboardSummaryCard[]>(() => {
    const toReceiveAmount = partyBalances
      .filter((partyBalance) => partyBalance.balanceDirection === "receive")
      .reduce((sum, partyBalance) => sum + partyBalance.balanceAmount, 0);

    const toPayAmount = partyBalances
      .filter((partyBalance) => partyBalance.balanceDirection === "pay")
      .reduce((sum, partyBalance) => sum + partyBalance.balanceAmount, 0);

    return [
      {
        id: "to-receive",
        title: "To Receive",
        value: formatCurrencyAmount({
          amount: toReceiveAmount,
          currencyCode,
          countryCode,
        }),
        tone: "receive",
      },
      {
        id: "to-pay",
        title: "To Pay",
        value: formatCurrencyAmount({
          amount: toPayAmount,
          currencyCode,
          countryCode,
        }),
        tone: "pay",
      },
    ];
  }, [countryCode, currencyCode, partyBalances]);

  const todayInAmount = useMemo(
    () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const startTime = start.getTime();
      const endTime = startTime + 24 * 60 * 60 * 1000;

      return transactions.reduce((sum, transaction) => {
        const isToday =
          transaction.happenedAt >= startTime &&
          transaction.happenedAt < endTime;
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
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const startTime = start.getTime();
      const endTime = startTime + 24 * 60 * 60 * 1000;

      return transactions.reduce((sum, transaction) => {
        const isToday =
          transaction.happenedAt >= startTime &&
          transaction.happenedAt < endTime;
        if (!isToday || transaction.direction !== TransactionDirection.Out) {
          return sum;
        }

        return sum + transaction.amount;
      }, 0);
    },
    [transactions],
  );

  const dueItems = useMemo<readonly BusinessDashboardDueItem[]>(() => {
    return partyBalances
      .filter(
        (partyBalance) =>
          partyBalance.overdueAmount > 0 || partyBalance.dueTodayAmount > 0,
      )
      .sort((left, right) => {
        const leftWeight = left.overdueAmount > 0 ? 0 : 1;
        const rightWeight = right.overdueAmount > 0 ? 0 : 1;

        if (leftWeight !== rightWeight) {
          return leftWeight - rightWeight;
        }

        return right.lastEntryAt - left.lastEntryAt;
      })
      .slice(0, 6)
      .map((partyBalance) => {
        const amount =
          partyBalance.overdueAmount > 0
            ? partyBalance.overdueAmount
            : partyBalance.dueTodayAmount;

        return {
          id: partyBalance.id,
          name: partyBalance.partyName,
          subtitle: partyBalance.overdueAmount > 0 ? "Overdue" : "Due today",
          amount: formatCurrencyAmount({
            amount,
            currencyCode,
            countryCode,
          }),
          direction: partyBalance.balanceDirection,
        };
      });
  }, [countryCode, currencyCode, partyBalances]);

  const overdueCountLabel = useMemo(
    () =>
      String(
        partyBalances.filter((partyBalance) => partyBalance.overdueAmount > 0)
          .length,
      ),
    [partyBalances],
  );

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

  return useMemo<BusinessDashboardViewModel>(
    () => ({
      isLoading,
      errorMessage,
      summaryCards,
      quickActions,
      todayInValue,
      todayOutValue,
      overdueCountLabel,
      dueItems,
    }),
    [
      dueItems,
      errorMessage,
      isLoading,
      overdueCountLabel,
      summaryCards,
      todayInValue,
      todayOutValue,
    ],
  );
};
