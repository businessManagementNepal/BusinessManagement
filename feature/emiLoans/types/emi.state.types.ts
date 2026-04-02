import {
  EmiPaymentDirectionValue,
  EmiPlanModeValue,
  EmiPlanTypeValue,
} from "./emi.entity.types";

export const EmiListFilter = {
  All: "all",
  Active: "active",
  Due: "due",
  Overdue: "overdue",
  Closed: "closed",
  Collect: "collect",
  Pay: "pay",
} as const;

export type EmiListFilterValue = (typeof EmiListFilter)[keyof typeof EmiListFilter];

export type EmiSummaryCardState = {
  id: string;
  label: string;
  value: string;
  tone: "collect" | "pay" | "overdue" | "neutral";
};

export type EmiPlanListItemState = {
  remoteId: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  progressLabel: string;
  badgeLabel: string;
  tone: "collect" | "pay";
  isOverdue: boolean;
  isClosed: boolean;
};

export type EmiPlanEditorState = {
  visible: boolean;
  planMode: EmiPlanModeValue;
  planType: EmiPlanTypeValue;
  title: string;
  counterpartyName: string;
  counterpartyPhone: string;
  totalAmount: string;
  installmentCount: string;
  firstDueAt: string;
  reminderEnabled: boolean;
  reminderDaysBefore: string;
  note: string;
  errorMessage: string | null;
  isSaving: boolean;
};

export type EmiInstallmentItemState = {
  remoteId: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  statusLabel: string;
  isPaid: boolean;
  isOverdue: boolean;
};

export type EmiPlanDetailState = {
  remoteId: string;
  title: string;
  subtitle: string;
  totalAmountLabel: string;
  remainingAmountLabel: string;
  dueTodayLabel: string;
  overdueLabel: string;
  nextDueLabel: string;
  progressLabel: string;
  reminderLabel: string;
  statusLabel: string;
  paymentDirection: EmiPaymentDirectionValue;
  counterpartyName: string | null;
  counterpartyPhone: string | null;
  installmentItems: readonly EmiInstallmentItemState[];
};
