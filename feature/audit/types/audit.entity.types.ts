import type { Result } from "@/shared/types/result.types";

export const AuditModule = {
  Sync: "sync",
  Settings: "settings",
  Transactions: "transactions",
  Pos: "pos",
  Billing: "billing",
  Ledger: "ledger",
  Inventory: "inventory",
  Orders: "orders",
  MoneyAccounts: "money_accounts",
} as const;

export type AuditModuleValue = (typeof AuditModule)[keyof typeof AuditModule];

export const AuditOutcome = {
  Success: "success",
  Failure: "failure",
  Partial: "partial",
} as const;

export type AuditOutcomeValue = (typeof AuditOutcome)[keyof typeof AuditOutcome];

export const AuditSeverity = {
  Info: "info",
  Warning: "warning",
  Critical: "critical",
} as const;

export type AuditSeverityValue =
  (typeof AuditSeverity)[keyof typeof AuditSeverity];

export type AuditEvent = {
  remoteId: string;
  accountRemoteId: string;
  ownerUserRemoteId: string;
  actorUserRemoteId: string;
  module: AuditModuleValue;
  action: string;
  sourceModule: string;
  sourceRemoteId: string;
  sourceAction: string;
  outcome: AuditOutcomeValue;
  severity: AuditSeverityValue;
  summary: string;
  metadataJson: string | null;
  createdAt: number;
  syncStatus: "pending" | "synced" | "failed";
  lastSyncedAt: number | null;
  deletedAt: number | null;
};

export type SaveAuditEventPayload = {
  remoteId: string;
  accountRemoteId: string;
  ownerUserRemoteId: string;
  actorUserRemoteId: string;
  module: AuditModuleValue;
  action: string;
  sourceModule: string;
  sourceRemoteId: string;
  sourceAction: string;
  outcome: AuditOutcomeValue;
  severity: AuditSeverityValue;
  summary: string;
  metadataJson?: string | null;
  createdAt: number;
};

export type AuditResult<T> = Result<T, import("./audit.error.types").AuditError>;
