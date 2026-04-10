import { useCallback, useEffect, useMemo, useState } from "react";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { LedgerEntryTypeValue, LedgerPartyBalance } from "@/feature/ledger/types/ledger.entity.types";
import {
  LedgerAgingBucketState,
  LedgerCollectionQueueItemState,
  LedgerListFilter,
  LedgerListFilterValue,
  LedgerPartyListItemState,
  LedgerSummaryCardState,
} from "@/feature/ledger/types/ledger.state.types";
import { LedgerListViewModel } from "./ledgerList.viewModel";
import {
  buildLedgerOutstandingDueItems,
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
  onQuickCollectForParty: (partyName: string) => void;
  onOpenPartyDetail: (partyId: string, partyName: string) => Promise<void> | void;
  reloadSignal: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const getTodayStartTimestamp = (): number => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const useLedgerListViewModel = ({
  businessAccountRemoteId,
  businessAccountCurrencyCode,
  businessAccountCountryCode,
  getLedgerEntriesUseCase,
  onOpenCreate,
  onQuickCollectForParty,
  onOpenPartyDetail,
  reloadSignal,
}: UseLedgerListViewModelParams): LedgerListViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [partyBalances, setPartyBalances] = useState<readonly LedgerPartyBalance[]>([]);
  const [outstandingDueItems, setOutstandingDueItems] = useState<
    ReturnType<typeof buildLedgerOutstandingDueItems>
  >([]);
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
      setOutstandingDueItems([]);
      setIsLoading(false);
      return;
    }

    setPartyBalances(buildLedgerPartyBalances(result.value));
    setOutstandingDueItems(buildLedgerOutstandingDueItems(result.value));
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

  const agingBuckets = useMemo<readonly LedgerAgingBucketState[]>(() => {
    const todayStart = getTodayStartTimestamp();
    const sums = {
      current: { amount: 0, count: 0 },
      "1_30": { amount: 0, count: 0 },
      "31_60": { amount: 0, count: 0 },
      "61_90": { amount: 0, count: 0 },
      "90_plus": { amount: 0, count: 0 },
    };

    outstandingDueItems
      .filter((item) => item.direction === "receive")
      .forEach((item) => {
        if (item.dueAt === null || item.dueAt >= todayStart) {
          sums.current.amount += item.outstandingAmount;
          sums.current.count += 1;
          return;
        }

        const daysPastDue = Math.max(
          1,
          Math.floor((todayStart - item.dueAt) / DAY_MS),
        );

        if (daysPastDue <= 30) {
          sums["1_30"].amount += item.outstandingAmount;
          sums["1_30"].count += 1;
          return;
        }

        if (daysPastDue <= 60) {
          sums["31_60"].amount += item.outstandingAmount;
          sums["31_60"].count += 1;
          return;
        }

        if (daysPastDue <= 90) {
          sums["61_90"].amount += item.outstandingAmount;
          sums["61_90"].count += 1;
          return;
        }

        sums["90_plus"].amount += item.outstandingAmount;
        sums["90_plus"].count += 1;
      });

    return [
      {
        id: "current",
        label: "Current",
        amountLabel: formatCurrency(
          sums.current.amount,
          businessAccountCurrencyCode,
          businessAccountCountryCode,
        ),
        countLabel: `${sums.current.count} due`,
        tone: "neutral",
      },
      {
        id: "1_30",
        label: "1-30d",
        amountLabel: formatCurrency(
          sums["1_30"].amount,
          businessAccountCurrencyCode,
          businessAccountCountryCode,
        ),
        countLabel: `${sums["1_30"].count} overdue`,
        tone: "warning",
      },
      {
        id: "31_60",
        label: "31-60d",
        amountLabel: formatCurrency(
          sums["31_60"].amount,
          businessAccountCurrencyCode,
          businessAccountCountryCode,
        ),
        countLabel: `${sums["31_60"].count} overdue`,
        tone: "warning",
      },
      {
        id: "61_90",
        label: "61-90d",
        amountLabel: formatCurrency(
          sums["61_90"].amount,
          businessAccountCurrencyCode,
          businessAccountCountryCode,
        ),
        countLabel: `${sums["61_90"].count} overdue`,
        tone: "destructive",
      },
      {
        id: "90_plus",
        label: "90+d",
        amountLabel: formatCurrency(
          sums["90_plus"].amount,
          businessAccountCurrencyCode,
          businessAccountCountryCode,
        ),
        countLabel: `${sums["90_plus"].count} overdue`,
        tone: "destructive",
      },
    ] as const;
  }, [
    businessAccountCountryCode,
    businessAccountCurrencyCode,
    outstandingDueItems,
  ]);

  const collectionQueue = useMemo<readonly LedgerCollectionQueueItemState[]>(() => {
    const todayStart = getTodayStartTimestamp();
    const byParty = new Map<
      string,
      {
        partyId: string;
        partyName: string;
        totalAmount: number;
        itemCount: number;
        maxDaysPastDue: number;
      }
    >();

    outstandingDueItems
      .filter(
        (item) =>
          item.direction === "receive" &&
          item.dueAt !== null &&
          item.dueAt < todayStart,
      )
      .forEach((item) => {
        const daysPastDue = Math.max(
          1,
          Math.floor((todayStart - (item.dueAt as number)) / DAY_MS),
        );
        const existing = byParty.get(item.partyId);

        if (!existing) {
          byParty.set(item.partyId, {
            partyId: item.partyId,
            partyName: item.partyName,
            totalAmount: item.outstandingAmount,
            itemCount: 1,
            maxDaysPastDue: daysPastDue,
          });
          return;
        }

        existing.totalAmount += item.outstandingAmount;
        existing.itemCount += 1;
        existing.maxDaysPastDue = Math.max(existing.maxDaysPastDue, daysPastDue);
      });

    return Array.from(byParty.values())
      .sort((left, right) => {
        if (right.maxDaysPastDue !== left.maxDaysPastDue) {
          return right.maxDaysPastDue - left.maxDaysPastDue;
        }
        return right.totalAmount - left.totalAmount;
      })
      .slice(0, 8)
      .map((item) => ({
        id: item.partyId,
        partyId: item.partyId,
        partyName: item.partyName,
        amountLabel: formatCurrency(
          item.totalAmount,
          businessAccountCurrencyCode,
          businessAccountCountryCode,
        ),
        metaLabel: `${item.maxDaysPastDue}d overdue | ${item.itemCount} open bill${
          item.itemCount > 1 ? "s" : ""
        }`,
        priority:
          item.maxDaysPastDue > 90
            ? "critical"
            : item.maxDaysPastDue > 60
              ? "high"
              : "normal",
      }));
  }, [
    businessAccountCountryCode,
    businessAccountCurrencyCode,
    outstandingDueItems,
  ]);

  const hasOverdueAging = useMemo(() => {
    const todayStart = getTodayStartTimestamp();
    return outstandingDueItems.some(
      (item) =>
        item.direction === "receive" &&
        item.dueAt !== null &&
        item.dueAt < todayStart,
    );
  }, [outstandingDueItems]);

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
        subtitle: subtitleParts.join(" | "),
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

    return "No ledger party yet. Add your first sale due, purchase due, or receive money entry.";
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
      hasOverdueAging,
      agingBuckets,
      collectionQueue,
      partyItems,
      emptyStateMessage,
      refresh: loadLedger,
      onChangeSearchQuery: setSearchQuery,
      onChangeFilter: setSelectedFilter,
      onOpenCreate,
      onQuickCollectFromQueue: onQuickCollectForParty,
      onOpenPartyDetail: handleOpenPartyDetail,
    }),
    [
      agingBuckets,
      collectionQueue,
      emptyStateMessage,
      errorMessage,
      handleOpenPartyDetail,
      isLoading,
      loadLedger,
      onOpenCreate,
      onQuickCollectForParty,
      partyItems,
      searchQuery,
      selectedFilter,
      summaryCards,
      hasOverdueAging,
    ],
  );
};

