import { useCallback, useEffect, useMemo, useState } from "react";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { LedgerEntryTypeValue, LedgerPartyBalance } from "@/feature/ledger/types/ledger.entity.types";
import {
  LedgerListFilter,
  LedgerListFilterValue,
  LedgerPartyListItemState,
  LedgerSummaryCardState,
} from "@/feature/ledger/types/ledger.state.types";
import { LedgerListViewModel } from "./ledgerList.viewModel";
import {
  buildLedgerPartyBalances,
  formatCurrency,
  formatDateLabel,
} from "./ledger.shared";

type UseLedgerListViewModelParams = {
  businessAccountRemoteId: string;
  businessAccountCurrencyCode: string | null;
  businessAccountCountryCode: string | null;
  getLedgerEntriesUseCase: GetLedgerEntriesUseCase;
  onOpenCreate: (entryType: LedgerEntryTypeValue) => void;
  onOpenPartyDetail: (partyId: string, partyName: string) => Promise<void> | void;
  reloadSignal: number;
};

export const useLedgerListViewModel = ({
  businessAccountRemoteId,
  businessAccountCurrencyCode,
  businessAccountCountryCode,
  getLedgerEntriesUseCase,
  onOpenCreate,
  onOpenPartyDetail,
  reloadSignal,
}: UseLedgerListViewModelParams): LedgerListViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [partyBalances, setPartyBalances] = useState<readonly LedgerPartyBalance[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<LedgerListFilterValue>(
    LedgerListFilter.All,
  );

  const loadLedger = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    const result = await getLedgerEntriesUseCase.execute({
      businessAccountRemoteId,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      setPartyBalances([]);
      setIsLoading(false);
      return;
    }

    setPartyBalances(buildLedgerPartyBalances(result.value));
    setErrorMessage(null);
    setIsLoading(false);
  }, [businessAccountRemoteId, getLedgerEntriesUseCase]);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger, reloadSignal]);

  const filteredPartyBalances = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return partyBalances.filter((partyBalance) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        partyBalance.partyName.toLowerCase().includes(normalizedSearch) ||
        (partyBalance.partyPhone ?? "").toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      switch (selectedFilter) {
        case LedgerListFilter.ToReceive:
          return partyBalance.balanceDirection === "receive" && partyBalance.balanceAmount > 0;
        case LedgerListFilter.ToPay:
          return partyBalance.balanceDirection === "pay" && partyBalance.balanceAmount > 0;
        case LedgerListFilter.DueToday:
          return partyBalance.dueTodayAmount > 0;
        case LedgerListFilter.Overdue:
          return partyBalance.overdueAmount > 0;
        case LedgerListFilter.All:
        default:
          return true;
      }
    });
  }, [partyBalances, searchQuery, selectedFilter]);

  const summaryCards = useMemo<readonly LedgerSummaryCardState[]>(() => {
    const receiveAmount = partyBalances
      .filter((partyBalance) => partyBalance.balanceDirection === "receive")
      .reduce((total, partyBalance) => total + partyBalance.balanceAmount, 0);

    const payAmount = partyBalances
      .filter((partyBalance) => partyBalance.balanceDirection === "pay")
      .reduce((total, partyBalance) => total + partyBalance.balanceAmount, 0);

    const dueTodayAmount = partyBalances.reduce(
      (total, partyBalance) => total + partyBalance.dueTodayAmount,
      0,
    );

    const overdueAmount = partyBalances.reduce(
      (total, partyBalance) => total + partyBalance.overdueAmount,
      0,
    );

    return [
      {
        id: "to-receive",
        label: "To Receive",
        value: formatCurrency(
          receiveAmount,
          businessAccountCurrencyCode,
          businessAccountCountryCode,
        ),
        tone: "receive",
      },
      {
        id: "to-pay",
        label: "To Pay",
        value: formatCurrency(
          payAmount,
          businessAccountCurrencyCode,
          businessAccountCountryCode,
        ),
        tone: "pay",
      },
      {
        id: "due-today",
        label: "Due Today",
        value: formatCurrency(
          dueTodayAmount,
          businessAccountCurrencyCode,
          businessAccountCountryCode,
        ),
        tone: "neutral",
      },
      {
        id: "overdue",
        label: "Overdue",
        value: formatCurrency(
          overdueAmount,
          businessAccountCurrencyCode,
          businessAccountCountryCode,
        ),
        tone: "neutral",
      },
    ] as const;
  }, [businessAccountCountryCode, businessAccountCurrencyCode, partyBalances]);

  const partyItems = useMemo<readonly LedgerPartyListItemState[]>(() => {
    return filteredPartyBalances.map((partyBalance) => {
      const dueBadge =
        partyBalance.overdueAmount > 0
          ? `Overdue ${formatCurrency(partyBalance.overdueAmount, partyBalance.currencyCode)}`
          : partyBalance.dueTodayAmount > 0
            ? `Due today ${formatCurrency(partyBalance.dueTodayAmount, partyBalance.currencyCode)}`
            : null;

      const subtitleParts = [
        formatDateLabel(partyBalance.lastEntryAt),
        `${partyBalance.openEntryCount} entries`,
      ];

      if (partyBalance.partyPhone) {
        subtitleParts.push(partyBalance.partyPhone);
      }

      return {
        id: partyBalance.id,
        partyName: partyBalance.partyName,
        subtitle: subtitleParts.join(" • "),
        amountLabel: formatCurrency(
          partyBalance.balanceAmount,
          partyBalance.currencyCode,
        ),
        tone: partyBalance.balanceDirection,
        badgeLabel: dueBadge,
      };
    });
  }, [filteredPartyBalances]);

  const emptyStateMessage = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return "No matching party found.";
    }

    if (selectedFilter === LedgerListFilter.DueToday) {
      return "No due today right now.";
    }

    if (selectedFilter === LedgerListFilter.Overdue) {
      return "No overdue balance right now.";
    }

    return "No ledger party yet. Add your first sale, purchase, or collection.";
  }, [searchQuery, selectedFilter]);

  const handleOpenPartyDetail = useCallback(
    (partyId: string) => {
      const selectedPartyBalance = partyBalances.find((partyBalance) => partyBalance.id === partyId);

      if (!selectedPartyBalance) {
        return;
      }

      onOpenPartyDetail(selectedPartyBalance.id, selectedPartyBalance.partyName);
    },
    [onOpenPartyDetail, partyBalances],
  );

  return useMemo(
    () => ({
      isLoading,
      errorMessage,
      searchQuery,
      selectedFilter,
      summaryCards,
      partyItems,
      emptyStateMessage,
      refresh: loadLedger,
      onChangeSearchQuery: setSearchQuery,
      onChangeFilter: setSelectedFilter,
      onOpenCreate,
      onOpenPartyDetail: handleOpenPartyDetail,
    }),
    [
      emptyStateMessage,
      errorMessage,
      handleOpenPartyDetail,
      isLoading,
      loadLedger,
      onOpenCreate,
      partyItems,
      searchQuery,
      selectedFilter,
      summaryCards,
    ],
  );
};
