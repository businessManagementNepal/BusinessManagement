import { useCallback, useEffect, useMemo, useState } from "react";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import {
  buildLedgerOutstandingDueItems,
  formatCurrency,
  formatDateLabel,
  getLedgerEntryTypeLabel,
} from "@/feature/ledger/viewModel/ledger.shared";
import { NotificationCenterViewModel } from "@/feature/notifications/viewModel/notificationCenter.viewModel";
import { NotificationCenterItemState } from "@/feature/notifications/types/notificationCenter.types";

type UseNotificationCenterViewModelParams = {
  businessAccountRemoteId: string | null;
  businessAccountCurrencyCode: string | null;
  businessAccountCountryCode: string | null;
  getLedgerEntriesUseCase: GetLedgerEntriesUseCase;
  onOpenLedger: () => void;
};

const getStartOfDayTimestamp = (timestamp: number): number => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const useNotificationCenterViewModel = ({
  businessAccountRemoteId,
  businessAccountCurrencyCode,
  businessAccountCountryCode,
  getLedgerEntriesUseCase,
  onOpenLedger,
}: UseNotificationCenterViewModelParams): NotificationCenterViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [items, setItems] = useState<readonly NotificationCenterItemState[]>([]);

  const load = useCallback(async () => {
    const resolvedBusinessAccountRemoteId = businessAccountRemoteId?.trim() ?? "";

    if (!resolvedBusinessAccountRemoteId) {
      setItems([]);
      setErrorMessage("Notification center needs an active business account.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const result = await getLedgerEntriesUseCase.execute({
      businessAccountRemoteId: resolvedBusinessAccountRemoteId,
    });

    if (!result.success) {
      setItems([]);
      setErrorMessage(result.error.message);
      setIsLoading(false);
      return;
    }

    const outstandingByDueEntryRemoteId = new Map(
      buildLedgerOutstandingDueItems(result.value).map((item) => [
        item.dueEntryRemoteId,
        item.outstandingAmount,
      ]),
    );

    const now = Date.now();
    const todayStart = getStartOfDayTimestamp(now);

    const mappedItems = result.value
      .filter((entry) => entry.reminderAt !== null)
      .filter((entry) => {
        const outstandingAmount = outstandingByDueEntryRemoteId.get(entry.remoteId);
        if (outstandingAmount === undefined) {
          return true;
        }
        return outstandingAmount > 0;
      })
      .map((entry) => {
        const reminderAt = entry.reminderAt as number;
        const amount = outstandingByDueEntryRemoteId.get(entry.remoteId) ?? entry.amount;
        const reminderDay = getStartOfDayTimestamp(reminderAt);
        const isOverdue = reminderAt < now;
        const isToday = reminderDay === todayStart;

        const timeLabel = isOverdue
          ? `Overdue reminder | ${formatDateLabel(reminderAt)}`
          : isToday
            ? `Reminder today | ${formatDateLabel(reminderAt)}`
            : `Upcoming reminder | ${formatDateLabel(reminderAt)}`;

        const tone = isOverdue ? "destructive" : isToday ? "warning" : "neutral";
        const toneRank = isOverdue ? 0 : isToday ? 1 : 2;

        return {
          id: entry.remoteId,
          title: entry.partyName,
          subtitle: `${getLedgerEntryTypeLabel(entry.entryType)}${
            entry.referenceNumber ? ` | Ref ${entry.referenceNumber}` : ""
          }`,
          amountLabel: formatCurrency(
            amount,
            entry.currencyCode ?? businessAccountCurrencyCode,
            businessAccountCountryCode,
          ),
          timeLabel,
          tone,
          toneRank,
          reminderAt,
        } as const;
      })
      .sort((left, right) => {
        if (left.toneRank !== right.toneRank) {
          return left.toneRank - right.toneRank;
        }

        return left.reminderAt - right.reminderAt;
      })
      .map(({ toneRank: _toneRank, reminderAt: _reminderAt, ...item }) => item)
      .slice(0, 80);

    setItems(mappedItems);
    setErrorMessage(null);
    setIsLoading(false);
  }, [
    businessAccountCountryCode,
    businessAccountCurrencyCode,
    businessAccountRemoteId,
    getLedgerEntriesUseCase,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const emptyStateMessage = useMemo(
    () => "No active ledger reminders right now.",
    [],
  );

  return useMemo(
    () => ({
      isLoading,
      errorMessage,
      items,
      emptyStateMessage,
      onRefresh: load,
      onOpenLedger,
    }),
    [emptyStateMessage, errorMessage, isLoading, items, load, onOpenLedger],
  );
};

