import { Result } from "@/shared/types/result.types";

export const LedgerEntryType = {
  Sale: "sale",
  Purchase: "purchase",
  Collection: "collection",
  PaymentOut: "payment_out",
  Refund: "refund",
  Advance: "advance",
  Adjustment: "adjustment",
} as const;

export type LedgerEntryTypeValue =
  (typeof LedgerEntryType)[keyof typeof LedgerEntryType];

export const LedgerBalanceDirection = {
  Receive: "receive",
  Pay: "pay",
} as const;

export type LedgerBalanceDirectionValue =
  (typeof LedgerBalanceDirection)[keyof typeof LedgerBalanceDirection];

export const LedgerEntrySyncStatus = {
  PendingCreate: "pending_create",
  PendingUpdate: "pending_update",
  PendingDelete: "pending_delete",
  Synced: "synced",
  Failed: "failed",
} as const;

export type LedgerEntrySyncStatusValue =
  (typeof LedgerEntrySyncStatus)[keyof typeof LedgerEntrySyncStatus];

export type LedgerEntry = {
  remoteId: string;
  businessAccountRemoteId: string;
  ownerUserRemoteId: string;
  partyName: string;
  partyPhone: string | null;
  entryType: LedgerEntryTypeValue;
  balanceDirection: LedgerBalanceDirectionValue;
  title: string;
  amount: number;
  currencyCode: string | null;
  note: string | null;
  happenedAt: number;
  dueAt: number | null;
  settlementAccountRemoteId: string | null;
  settlementAccountDisplayNameSnapshot: string | null;
  createdAt: number;
  updatedAt: number;
};

export type SaveLedgerEntryPayload = {
  remoteId: string;
  businessAccountRemoteId: string;
  ownerUserRemoteId: string;
  partyName: string;
  partyPhone: string | null;
  entryType: LedgerEntryTypeValue;
  balanceDirection: LedgerBalanceDirectionValue;
  title: string;
  amount: number;
  currencyCode: string | null;
  note: string | null;
  happenedAt: number;
  dueAt: number | null;
  settlementAccountRemoteId: string | null;
  settlementAccountDisplayNameSnapshot: string | null;
};

export type LedgerPartyBalance = {
  id: string;
  partyName: string;
  partyPhone: string | null;
  balanceDirection: LedgerBalanceDirectionValue;
  balanceAmount: number;
  currencyCode: string | null;
  lastEntryAt: number;
  dueTodayAmount: number;
  overdueAmount: number;
  openEntryCount: number;
};

export type LedgerEntriesResult = Result<
  LedgerEntry[],
  import("./ledger.error.types").LedgerError
>;

export type LedgerEntryResult = Result<
  LedgerEntry,
  import("./ledger.error.types").LedgerError
>;

export type LedgerPartiesResult = Result<
  LedgerPartyBalance[],
  import("./ledger.error.types").LedgerError
>;

export type LedgerOperationResult = Result<
  boolean,
  import("./ledger.error.types").LedgerError
>;
