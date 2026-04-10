import {
  LedgerBalanceDirectionValue,
  LedgerEntryTypeValue,
} from "./ledger.entity.types";

export const LedgerListFilter = {
  All: "all",
  ToReceive: "to_receive",
  ToPay: "to_pay",
  DueToday: "due_today",
  Overdue: "overdue",
} as const;

export type LedgerListFilterValue =
  (typeof LedgerListFilter)[keyof typeof LedgerListFilter];

export type LedgerSummaryCardState = {
  id: string;
  label: string;
  value: string;
  tone: "receive" | "pay" | "neutral";
};

export type LedgerAgingBucketState = {
  id: "current" | "1_30" | "31_60" | "61_90" | "90_plus";
  label: string;
  amountLabel: string;
  countLabel: string;
  tone: "neutral" | "warning" | "destructive";
};

export type LedgerCollectionQueueItemState = {
  id: string;
  partyId: string;
  partyName: string;
  amountLabel: string;
  metaLabel: string;
  priority: "normal" | "high" | "critical";
};

export type LedgerPartyListItemState = {
  id: string;
  partyName: string;
  subtitle: string;
  amountLabel: string;
  tone: LedgerBalanceDirectionValue;
  badgeLabel: string | null;
};

export type LedgerDetailEntryItemState = {
  id: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  tone: LedgerBalanceDirectionValue;
  entryTypeLabel: string;
};

export type LedgerPartyDetailState = {
  partyId: string;
  partyName: string;
  partyPhone: string | null;
  balanceLabel: string;
  balanceTone: LedgerBalanceDirectionValue;
  dueTodayLabel: string;
  overdueLabel: string;
  entryItems: readonly LedgerDetailEntryItemState[];
};

export type LedgerEditorMode = "create" | "edit";

export type LedgerEditorFieldName =
  | "partyName"
  | "amount"
  | "happenedAt"
  | "dueAt"
  | "settlementAccountRemoteId"
  | "settledAgainstEntryRemoteId"
  | "reminderAt";

export type LedgerEditorFieldErrors = Partial<
  Record<LedgerEditorFieldName, string>
>;

export type LedgerEditorFormState = {
  visible: boolean;
  mode: LedgerEditorMode;
  editingRemoteId: string | null;
  entryType: LedgerEntryTypeValue;
  partyName: string;
  amount: string;
  happenedAt: string;
  dueAt: string;
  settlementAccountRemoteId: string;
  referenceNumber: string;
  note: string;
  reminderAt: string;
  attachmentUri: string;
  settledAgainstEntryRemoteId: string;
  linkedTransactionRemoteId: string | null;
  showMoreDetails: boolean;
  fieldErrors: LedgerEditorFieldErrors;
  isSaving: boolean;
  errorMessage: string | null;
};

export type LedgerAccountOptionState = {
  remoteId: string;
  label: string;
  currencyCode: string | null;
};

export type LedgerEntryTypeOptionState = {
  value: LedgerEntryTypeValue;
  label: string;
};

export type LedgerSettlementLinkOptionState = {
  value: string;
  label: string;
};
