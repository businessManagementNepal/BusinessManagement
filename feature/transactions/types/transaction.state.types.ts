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

export type TransactionSummaryCardState = {
  id: string;
  label: string;
  value: string;
  tone: "income" | "expense";
};

export type TransactionListItemState = {
  remoteId: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  tone: "income" | "expense";
  transactionType: TransactionTypeValue;
};

export type TransactionAccountOption = {
  remoteId: string;
  label: string;
  currencyCode: string | null;
};

export type TransactionEditorMode = "create" | "edit";

export type TransactionEditorState = {
  visible: boolean;
  mode: TransactionEditorMode;
  remoteId: string | null;
  type: TransactionTypeValue;
  direction: TransactionDirectionValue;
  title: string;
  amount: string;
  accountRemoteId: string;
  categoryLabel: string;
  note: string;
  happenedAt: string;
  errorMessage: string | null;
  isSaving: boolean;
};
