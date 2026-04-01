import { Result } from "@/shared/types/result.types";

export const TransactionType = {
  Income: "income",
  Expense: "expense",
  Transfer: "transfer",
  Refund: "refund",
} as const;

export type TransactionTypeValue =
  (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionDirection = {
  In: "in",
  Out: "out",
} as const;

export type TransactionDirectionValue =
  (typeof TransactionDirection)[keyof typeof TransactionDirection];

export const TransactionSyncStatus = {
  PendingCreate: "pending_create",
  PendingUpdate: "pending_update",
  PendingDelete: "pending_delete",
  Synced: "synced",
  Failed: "failed",
} as const;

export type TransactionSyncStatusValue =
  (typeof TransactionSyncStatus)[keyof typeof TransactionSyncStatus];

export type Transaction = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  accountDisplayNameSnapshot: string;
  transactionType: TransactionTypeValue;
  direction: TransactionDirectionValue;
  title: string;
  amount: number;
  currencyCode: string | null;
  categoryLabel: string | null;
  note: string | null;
  happenedAt: number;
  createdAt: number;
  updatedAt: number;
};

export type SaveTransactionPayload = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  accountDisplayNameSnapshot: string;
  transactionType: TransactionTypeValue;
  direction: TransactionDirectionValue;
  title: string;
  amount: number;
  currencyCode: string | null;
  categoryLabel: string | null;
  note: string | null;
  happenedAt: number;
};

export type TransactionsResult = Result<
  Transaction[],
  import("./transaction.error.types").TransactionError
>;
export type TransactionResult = Result<
  Transaction,
  import("./transaction.error.types").TransactionError
>;
export type TransactionOperationResult = Result<
  boolean,
  import("./transaction.error.types").TransactionError
>;
