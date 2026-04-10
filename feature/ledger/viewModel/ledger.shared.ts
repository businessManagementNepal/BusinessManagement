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

export type LedgerSettlementLinkCandidate = {
  remoteId: string;
  label: string;
  outstandingAmount: number;
};

export type LedgerOutstandingDueItem = {
  dueEntryRemoteId: string;
  partyId: string;
  partyName: string;
  partyPhone: string | null;
  direction: LedgerBalanceDirectionValue;
  outstandingAmount: number;
  currencyCode: string | null;
  dueAt: number | null;
  happenedAt: number;
  referenceNumber: string | null;
};

const getDueLikeSortTimestamp = (entry: {
  dueAt: number | null;
  happenedAt: number;
}): number => entry.dueAt ?? entry.happenedAt;

const receiveEntryTypes = new Set<LedgerEntryTypeValue>([
  LedgerEntryType.Sale,
]);

const payEntryTypes = new Set<LedgerEntryTypeValue>([
  LedgerEntryType.Purchase,
]);

const roundCurrency = (value: number): number => Number(value.toFixed(2));

const getDueSortTimestamp = (entry: LedgerEntry): number =>
  entry.dueAt ?? entry.happenedAt;

const isDueEntry = (entry: LedgerEntry): boolean =>
  receiveEntryTypes.has(entry.entryType) || payEntryTypes.has(entry.entryType);

const isReceiveDueEntry = (entry: LedgerEntry): boolean =>
  receiveEntryTypes.has(entry.entryType);

const isPayDueEntry = (entry: LedgerEntry): boolean =>
  payEntryTypes.has(entry.entryType);

const isReceiveSettlementEntry = (entry: LedgerEntry): boolean =>
  entry.entryType === LedgerEntryType.Collection;

const isPaySettlementEntry = (entry: LedgerEntry): boolean =>
  entry.entryType === LedgerEntryType.PaymentOut;

const allocateSettlementAmount = ({
  settlementEntries,
  outstandingByDueId,
  targetDueIds,
}: {
  settlementEntries: readonly LedgerEntry[];
  outstandingByDueId: Map<string, number>;
  targetDueIds: readonly string[];
}): void => {
  const targetSet = new Set(targetDueIds);

  settlementEntries.forEach((settlementEntry) => {
    let remainingAmount = settlementEntry.amount;
    if (remainingAmount <= 0) {
      return;
    }

    const linkedDueRemoteId = settlementEntry.settledAgainstEntryRemoteId;
    if (linkedDueRemoteId && targetSet.has(linkedDueRemoteId)) {
      const linkedOutstanding = outstandingByDueId.get(linkedDueRemoteId) ?? 0;
      if (linkedOutstanding > 0) {
        const allocatedToLinked = Math.min(linkedOutstanding, remainingAmount);
        remainingAmount = roundCurrency(remainingAmount - allocatedToLinked);
        outstandingByDueId.set(
          linkedDueRemoteId,
          roundCurrency(linkedOutstanding - allocatedToLinked),
        );
      }
    }

    if (remainingAmount <= 0) {
      return;
    }

    for (const dueRemoteId of targetDueIds) {
      const dueOutstanding = outstandingByDueId.get(dueRemoteId) ?? 0;
      if (dueOutstanding <= 0) {
        continue;
      }

      const allocated = Math.min(dueOutstanding, remainingAmount);
      remainingAmount = roundCurrency(remainingAmount - allocated);
      outstandingByDueId.set(dueRemoteId, roundCurrency(dueOutstanding - allocated));

      if (remainingAmount <= 0) {
        break;
      }
    }
  });
};

const buildOutstandingByDueEntryRemoteId = (
  entries: readonly LedgerEntry[],
): Map<string, number> => {
  const entriesByParty = new Map<string, LedgerEntry[]>();

  entries.forEach((entry) => {
    const partyKey = normalizePartyKey(entry);
    const existingEntries = entriesByParty.get(partyKey);
    if (existingEntries) {
      existingEntries.push(entry);
      return;
    }
    entriesByParty.set(partyKey, [entry]);
  });

  const outstandingByDueId = new Map<string, number>();

  entriesByParty.forEach((partyEntries) => {
    const dueEntries = partyEntries
      .filter(isDueEntry)
      .sort((left, right) => getDueSortTimestamp(left) - getDueSortTimestamp(right));

    dueEntries.forEach((dueEntry) => {
      outstandingByDueId.set(dueEntry.remoteId, roundCurrency(dueEntry.amount));
    });

    const receiveDueIds = dueEntries
      .filter(isReceiveDueEntry)
      .map((dueEntry) => dueEntry.remoteId);
    const payDueIds = dueEntries
      .filter(isPayDueEntry)
      .map((dueEntry) => dueEntry.remoteId);

    const receiveSettlements = partyEntries
      .filter(isReceiveSettlementEntry)
      .sort((left, right) => left.happenedAt - right.happenedAt);
    const paySettlements = partyEntries
      .filter(isPaySettlementEntry)
      .sort((left, right) => left.happenedAt - right.happenedAt);

    allocateSettlementAmount({
      settlementEntries: receiveSettlements,
      outstandingByDueId,
      targetDueIds: receiveDueIds,
    });
    allocateSettlementAmount({
      settlementEntries: paySettlements,
      outstandingByDueId,
      targetDueIds: payDueIds,
    });
  });

  return outstandingByDueId;
};

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
      return "Sale Due";
    case LedgerEntryType.Purchase:
      return "Purchase Due";
    case LedgerEntryType.Collection:
      return "Receive Money";
    case LedgerEntryType.PaymentOut:
      return "Pay Money";
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

export const getLedgerPartyLabel = (
  entryType: LedgerEntryTypeValue,
): "Customer" | "Supplier" | "Party" => {
  if (entryType === LedgerEntryType.Sale || entryType === LedgerEntryType.Collection) {
    return "Customer";
  }

  if (
    entryType === LedgerEntryType.Purchase ||
    entryType === LedgerEntryType.PaymentOut
  ) {
    return "Supplier";
  }

  return "Party";
};

export const requiresDueDate = (entryType: LedgerEntryTypeValue): boolean => {
  return entryType === LedgerEntryType.Sale || entryType === LedgerEntryType.Purchase;
};

export const requiresPaymentMode = (
  entryType: LedgerEntryTypeValue,
): boolean => {
  return (
    entryType === LedgerEntryType.Collection ||
    entryType === LedgerEntryType.PaymentOut
  );
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

const normalizePartyKey = (entry: Pick<LedgerEntry, "partyName" | "partyPhone">): string => {
  const normalizedName = entry.partyName.trim().toLowerCase();
  const normalizedPhone = entry.partyPhone?.trim().toLowerCase() || "";
  return `${normalizedName}::${normalizedPhone}`;
};

const normalizePartyName = (value: string): string => value.trim().toLowerCase();

const resolveDueEntryTypeForSettlement = (
  settlementEntryType: LedgerEntryTypeValue,
): LedgerEntryTypeValue | null => {
  if (settlementEntryType === LedgerEntryType.Collection) {
    return LedgerEntryType.Sale;
  }

  if (settlementEntryType === LedgerEntryType.PaymentOut) {
    return LedgerEntryType.Purchase;
  }

  return null;
};

export const buildLedgerOutstandingDueItems = (
  entries: readonly LedgerEntry[],
): LedgerOutstandingDueItem[] => {
  const outstandingByDueId = buildOutstandingByDueEntryRemoteId(entries);

  return entries
    .filter(isDueEntry)
    .map((entry) => {
      const outstandingAmount = roundCurrency(
        outstandingByDueId.get(entry.remoteId) ?? entry.amount,
      );

      if (outstandingAmount <= 0) {
        return null;
      }

      return {
        dueEntryRemoteId: entry.remoteId,
        partyId: normalizePartyKey(entry),
        partyName: entry.partyName,
        partyPhone: entry.partyPhone,
        direction: isReceiveDueEntry(entry)
          ? LedgerBalanceDirection.Receive
          : LedgerBalanceDirection.Pay,
        outstandingAmount,
        currencyCode: entry.currencyCode,
        dueAt: entry.dueAt,
        happenedAt: entry.happenedAt,
        referenceNumber: entry.referenceNumber,
      };
    })
    .filter((item): item is LedgerOutstandingDueItem => item !== null)
    .sort(
      (left, right) =>
        getDueLikeSortTimestamp(left) - getDueLikeSortTimestamp(right),
    );
};

export const buildSettlementLinkCandidates = ({
  entries,
  settlementEntryType,
  partyName,
  fallbackCurrencyCode,
  countryCode = null,
}: {
  entries: readonly LedgerEntry[];
  settlementEntryType: LedgerEntryTypeValue;
  partyName: string;
  fallbackCurrencyCode: string | null;
  countryCode?: string | null;
}): LedgerSettlementLinkCandidate[] => {
  const dueEntryType = resolveDueEntryTypeForSettlement(settlementEntryType);
  const normalizedPartyName = normalizePartyName(partyName);

  if (!dueEntryType || normalizedPartyName.length === 0) {
    return [];
  }

  const outstandingByDueId = buildOutstandingByDueEntryRemoteId(entries);

  return entries
    .filter(
      (entry) =>
        entry.entryType === dueEntryType &&
        normalizePartyName(entry.partyName) === normalizedPartyName,
    )
    .sort((left, right) => getDueSortTimestamp(left) - getDueSortTimestamp(right))
    .map((entry) => {
      const outstandingAmount = roundCurrency(
        outstandingByDueId.get(entry.remoteId) ?? entry.amount,
      );

      if (outstandingAmount <= 0) {
        return null;
      }

      const refText = (entry.referenceNumber ?? "").trim();
      const refLabel = refText.length > 0 ? `Ref ${refText} | ` : "";
      const dueLabel =
        entry.dueAt !== null
          ? `Due ${formatDateLabel(entry.dueAt)}`
          : `Date ${formatDateLabel(entry.happenedAt)}`;
      const amountLabel = formatCurrency(
        outstandingAmount,
        entry.currencyCode ?? fallbackCurrencyCode,
        countryCode,
      );

      return {
        remoteId: entry.remoteId,
        label: `${refLabel}${dueLabel} | Pending ${amountLabel}`,
        outstandingAmount,
      };
    })
    .filter(
      (
        candidate,
      ): candidate is LedgerSettlementLinkCandidate => candidate !== null,
    );
};

export const buildLedgerPartyBalances = (
  entries: readonly LedgerEntry[],
): LedgerPartyBalance[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const outstandingByDueEntryRemoteId = buildOutstandingByDueEntryRemoteId(entries);

  const aggregates = new Map<string, PartyAggregate>();

  entries.forEach((entry) => {
    const key = normalizePartyKey(entry);
    const existingAggregate = aggregates.get(key);
    const signedAmount = getLedgerSignedAmount(entry);
    const outstandingDueAmount =
      isDueEntry(entry) && entry.dueAt !== null
        ? roundCurrency(
            outstandingByDueEntryRemoteId.get(entry.remoteId) ?? entry.amount,
          )
        : 0;

    if (existingAggregate) {
      existingAggregate.netAmount += signedAmount;
      existingAggregate.lastEntryAt = Math.max(existingAggregate.lastEntryAt, entry.happenedAt);
      existingAggregate.openEntryCount += 1;

      if (entry.dueAt !== null && outstandingDueAmount > 0) {
        if (entry.dueAt < todayTime) {
          existingAggregate.overdueAmount += outstandingDueAmount;
        } else if (entry.dueAt === todayTime) {
          existingAggregate.dueTodayAmount += outstandingDueAmount;
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
        entry.dueAt !== null && outstandingDueAmount > 0 && entry.dueAt === todayTime
          ? outstandingDueAmount
          : 0,
      overdueAmount:
        entry.dueAt !== null && outstandingDueAmount > 0 && entry.dueAt < todayTime
          ? outstandingDueAmount
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
      title:
        entry.title.trim().length > 0
          ? entry.title
          : getLedgerEntryTypeLabel(entry.entryType),
      subtitle: `${formatDateLabel(entry.happenedAt)} | ${getLedgerEntryTypeLabel(entry.entryType)}${
        entry.note ? ` | ${entry.note}` : ""
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
