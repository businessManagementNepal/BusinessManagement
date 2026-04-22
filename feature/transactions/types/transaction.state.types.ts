import {
  TransactionDirectionValue,
  TransactionTypeValue,
} from "./transaction.entity.types";

export const TransactionListFilter = {
  All: "all",
  Income: "income",
  Expense: "expense",
  Transfer: "transfer",
} as const;

export type TransactionListFilterValue =
  (typeof TransactionListFilter)[keyof typeof TransactionListFilter];

export const TransactionSourceFilter = {
  All: "all",
  Manual: "manual",
  MoneyAccounts: "money_accounts",
  Ledger: "ledger",
  Billing: "billing",
  Pos: "pos",
  Emi: "emi",
  Orders: "orders",
} as const;

export type TransactionSourceFilterValue =
  (typeof TransactionSourceFilter)[keyof typeof TransactionSourceFilter];

export const TransactionDateFilter = {
  All: "all",
  Today: "today",
  Last7Days: "last_7_days",
  Last30Days: "last_30_days",
  ThisMonth: "this_month",
} as const;

export type TransactionDateFilterValue =
  (typeof TransactionDateFilter)[keyof typeof TransactionDateFilter];

export const TransactionPostingFilter = {
  All: "all",
  Posted: "posted",
  Voided: "voided",
} as const;

export type TransactionPostingFilterValue =
  (typeof TransactionPostingFilter)[keyof typeof TransactionPostingFilter];

export type TransactionSummaryCardState = {
  id: string;
  label: string;
  value: string;
  tone: "income" | "expense" | "neutral";
};

export type TransactionMetaChipState = {
  label: string;
  tone: "success" | "warning" | "danger" | "neutral";
};

export type TransactionListItemState = {
  remoteId: string;
  title: string;
  partyLabel: string | null;
  subtitle: string;
  amountLabel: string;
  tone: "income" | "expense";
  transactionType: TransactionTypeValue;
  isVoided: boolean;
  metaChips: readonly TransactionMetaChipState[];
};

export type TransactionAccountOption = {
  remoteId: string;
  label: string;
  currencyCode: string | null;
};

export type TransactionMoneyAccountOption = {
  remoteId: string;
  label: string;
};

export type TransactionFilterOption = {
  value: string;
  label: string;
};

export type TransactionEditorMode = "create" | "edit";

export type TransactionEditorFieldName =
  | "accountRemoteId"
  | "settlementMoneyAccountRemoteId"
  | "amount"
  | "happenedAt";

export type TransactionEditorFieldErrors = Partial<
  Record<TransactionEditorFieldName, string>
>;

export type TransactionEditorState = {
  visible: boolean;
  mode: TransactionEditorMode;
  remoteId: string | null;
  type: TransactionTypeValue;
  direction: TransactionDirectionValue;
  title: string;
  amount: string;
  accountRemoteId: string;
  settlementMoneyAccountRemoteId: string;
  categoryLabel: string;
  note: string;
  happenedAt: string;
  fieldErrors: TransactionEditorFieldErrors;
  errorMessage: string | null;
  isSaving: boolean;
};
