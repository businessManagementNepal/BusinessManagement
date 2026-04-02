import { LedgerBalanceDirectionValue, LedgerEntryTypeValue } from "./ledger.entity.types";

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

export type LedgerEditorFormState = {
  visible: boolean;
  mode: LedgerEditorMode;
  editingRemoteId: string | null;
  partyName: string;
  partyPhone: string;
  entryType: LedgerEntryTypeValue;
  balanceDirection: LedgerBalanceDirectionValue;
  title: string;
  amount: string;
  note: string;
  happenedAt: string;
  dueAt: string;
  settlementAccountRemoteId: string;
  isSaving: boolean;
  errorMessage: string | null;
};

export type LedgerAccountOptionState = {
  remoteId: string;
  label: string;
};

export type LedgerEntryTypeOptionState = {
  value: LedgerEntryTypeValue;
  label: string;
};

export type LedgerDirectionOptionState = {
  value: LedgerBalanceDirectionValue;
  label: string;
};
