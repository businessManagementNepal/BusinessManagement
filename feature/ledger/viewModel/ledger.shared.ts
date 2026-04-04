import {
  LedgerBalanceDirection,
  LedgerBalanceDirectionValue,
  LedgerEntry,
  LedgerEntryType,
  LedgerEntryTypeValue,
  LedgerPartyBalance,
} from "@/feature/ledger/types/ledger.entity.types";
import {
  LedgerDetailEntryItemState,
  LedgerPartyDetailState,
} from "@/feature/ledger/types/ledger.state.types";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";

type PartyAggregate = {
  id: string;
  partyName: string;
  partyPhone: string | null;
  netAmount: number;
  currencyCode: string | null;
  lastEntryAt: number;
  dueTodayAmount: number;
  overdueAmount: number;
  openEntryCount: number;
};

const receiveEntryTypes = new Set<LedgerEntryTypeValue>([
  LedgerEntryType.Sale,
]);

const payEntryTypes = new Set<LedgerEntryTypeValue>([
  LedgerEntryType.Purchase,
]);

const settlementEntryTypes = new Set<LedgerEntryTypeValue>([
  LedgerEntryType.Collection,
  LedgerEntryType.PaymentOut,
]);

export const formatCurrency = (
  amount: number,
  currencyCode: string | null,
  countryCode: string | null = null,
): string => {
  return formatCurrencyAmount({
    amount,
    currencyCode,
    countryCode,
  });
};

export const formatDateLabel = (timestamp: number | null): string => {
  if (timestamp === null) {
    return "No due date";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const parseDateInput = (value: string): number | null => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return null;
  }

  const [yearText, monthText, dayText] = normalizedValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date.getTime();
};

export const formatDateInput = (timestamp: number | null): string => {
  if (timestamp === null) {
    return "";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getLedgerEntryTypeLabel = (
  entryType: LedgerEntryTypeValue,
): string => {
  switch (entryType) {
    case LedgerEntryType.Sale:
      return "Sale";
    case LedgerEntryType.Purchase:
      return "Purchase";
    case LedgerEntryType.Collection:
      return "Collection";
    case LedgerEntryType.PaymentOut:
      return "Payment Out";
    case LedgerEntryType.Refund:
      return "Refund";
    case LedgerEntryType.Advance:
      return "Advance";
    case LedgerEntryType.Adjustment:
      return "Adjustment";
    default:
      return "Entry";
  }
};

export const resolveDefaultDirectionForEntryType = (
  entryType: LedgerEntryTypeValue,
): LedgerBalanceDirectionValue => {
  if (entryType === LedgerEntryType.Sale || entryType === LedgerEntryType.Collection) {
    return LedgerBalanceDirection.Receive;
  }

  if (
    entryType === LedgerEntryType.Purchase ||
    entryType === LedgerEntryType.PaymentOut
  ) {
    return LedgerBalanceDirection.Pay;
  }

  return LedgerBalanceDirection.Receive;
};

export const shouldShowDirectionSelector = (
  entryType: LedgerEntryTypeValue,
): boolean => {
  return (
    entryType === LedgerEntryType.Refund ||
    entryType === LedgerEntryType.Advance ||
    entryType === LedgerEntryType.Adjustment
  );
};

export const getLedgerSignedAmount = (entry: LedgerEntry): number => {
  if (entry.entryType === LedgerEntryType.Sale) {
    return entry.amount;
  }

  if (entry.entryType === LedgerEntryType.Purchase) {
    return -entry.amount;
  }

  if (entry.entryType === LedgerEntryType.Collection) {
    return -entry.amount;
  }

  if (entry.entryType === LedgerEntryType.PaymentOut) {
    return entry.amount;
  }

  return entry.balanceDirection === LedgerBalanceDirection.Receive
    ? entry.amount
    : -entry.amount;
};

const getDueSignedAmount = (entry: LedgerEntry): number => {
  if (receiveEntryTypes.has(entry.entryType)) {
    return entry.amount;
  }

  if (payEntryTypes.has(entry.entryType)) {
    return -entry.amount;
  }

  if (
    entry.entryType === LedgerEntryType.Refund ||
    entry.entryType === LedgerEntryType.Advance ||
    entry.entryType === LedgerEntryType.Adjustment
  ) {
    return entry.balanceDirection === LedgerBalanceDirection.Receive
      ? entry.amount
      : -entry.amount;
  }

  if (settlementEntryTypes.has(entry.entryType)) {
    return 0;
  }

  return 0;
};

const normalizePartyKey = (entry: Pick<LedgerEntry, "partyName" | "partyPhone">): string => {
  const normalizedName = entry.partyName.trim().toLowerCase();
  const normalizedPhone = entry.partyPhone?.trim().toLowerCase() || "";
  return `${normalizedName}::${normalizedPhone}`;
};

export const buildLedgerPartyBalances = (
  entries: readonly LedgerEntry[],
): LedgerPartyBalance[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const aggregates = new Map<string, PartyAggregate>();

  entries.forEach((entry) => {
    const key = normalizePartyKey(entry);
    const existingAggregate = aggregates.get(key);
    const signedAmount = getLedgerSignedAmount(entry);
    const dueSignedAmount = getDueSignedAmount(entry);

    if (existingAggregate) {
      existingAggregate.netAmount += signedAmount;
      existingAggregate.lastEntryAt = Math.max(existingAggregate.lastEntryAt, entry.happenedAt);
      existingAggregate.openEntryCount += 1;

      if (entry.dueAt !== null && dueSignedAmount !== 0) {
        if (entry.dueAt < todayTime) {
          existingAggregate.overdueAmount += Math.abs(dueSignedAmount);
        } else if (entry.dueAt === todayTime) {
          existingAggregate.dueTodayAmount += Math.abs(dueSignedAmount);
        }
      }

      return;
    }

    aggregates.set(key, {
      id: key,
      partyName: entry.partyName,
      partyPhone: entry.partyPhone,
      netAmount: signedAmount,
      currencyCode: entry.currencyCode,
      lastEntryAt: entry.happenedAt,
      dueTodayAmount:
        entry.dueAt !== null && dueSignedAmount !== 0 && entry.dueAt === todayTime
          ? Math.abs(dueSignedAmount)
          : 0,
      overdueAmount:
        entry.dueAt !== null && dueSignedAmount !== 0 && entry.dueAt < todayTime
          ? Math.abs(dueSignedAmount)
          : 0,
      openEntryCount: 1,
    });
  });

  return Array.from(aggregates.values())
    .filter((aggregate) => aggregate.netAmount !== 0 || aggregate.openEntryCount > 0)
    .map((aggregate) => {
      const balanceAmount = Math.abs(aggregate.netAmount);
      const overdueAmount = Math.min(aggregate.overdueAmount, balanceAmount);
      const remainingAfterOverdue = Math.max(0, balanceAmount - overdueAmount);
      const dueTodayAmount = Math.min(
        aggregate.dueTodayAmount,
        remainingAfterOverdue,
      );

      return {
        id: aggregate.id,
        partyName: aggregate.partyName,
        partyPhone: aggregate.partyPhone,
        balanceDirection:
          aggregate.netAmount >= 0
            ? LedgerBalanceDirection.Receive
            : LedgerBalanceDirection.Pay,
        balanceAmount,
        currencyCode: aggregate.currencyCode,
        lastEntryAt: aggregate.lastEntryAt,
        dueTodayAmount,
        overdueAmount,
        openEntryCount: aggregate.openEntryCount,
      };
    })
    .sort((left, right) => right.lastEntryAt - left.lastEntryAt);
};

export const buildLedgerPartyDetailState = (
  partyBalance: LedgerPartyBalance,
  entries: readonly LedgerEntry[],
): LedgerPartyDetailState => {
  const entryItems: LedgerDetailEntryItemState[] = [...entries]
    .sort((left, right) => right.happenedAt - left.happenedAt)
    .map((entry) => ({
      id: entry.remoteId,
      title: entry.title,
      subtitle: `${formatDateLabel(entry.happenedAt)} • ${getLedgerEntryTypeLabel(entry.entryType)}${
        entry.note ? ` • ${entry.note}` : ""
      }`,
      amountLabel: formatCurrency(entry.amount, entry.currencyCode),
      tone: entry.balanceDirection,
      entryTypeLabel: getLedgerEntryTypeLabel(entry.entryType),
    }));

  return {
    partyId: partyBalance.id,
    partyName: partyBalance.partyName,
    partyPhone: partyBalance.partyPhone,
    balanceLabel: formatCurrency(
      partyBalance.balanceAmount,
      partyBalance.currencyCode,
    ),
    balanceTone: partyBalance.balanceDirection,
    dueTodayLabel: formatCurrency(
      partyBalance.dueTodayAmount,
      partyBalance.currencyCode,
    ),
    overdueLabel: formatCurrency(
      partyBalance.overdueAmount,
      partyBalance.currencyCode,
    ),
    entryItems,
  };
};
