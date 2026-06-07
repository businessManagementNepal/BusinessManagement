import type { AuditEvent, AuditResult } from "@/feature/audit/types/audit.entity.types";
import { AuditErrorType } from "@/feature/audit/types/audit.error.types";
import { MoneyAccountSyncStatus, MoneyAccountType } from "@/feature/accounts/types/moneyAccount.types";
import { createLocalMoneyAccountBalanceDatasource } from "@/feature/transactions/data/dataSource/local.moneyAccountBalance.datasource.impl";
import { createLocalMoneyPostingDatasource } from "@/feature/transactions/data/dataSource/local.moneyPosting.datasource.impl";
import { createMoneyPostingRepository } from "@/feature/transactions/data/repository/moneyPosting.repository.impl";
import { createMoneyPostingWorkflowRepository } from "@/feature/transactions/workflow/moneyPosting/repository/moneyPostingWorkflow.repository.impl";
import { createRunMoneyPostingWorkflowUseCase } from "@/feature/transactions/workflow/moneyPosting/useCase/runMoneyPostingWorkflow.useCase.impl";
import {
  SaveTransactionPayload,
  TransactionDirection,
  TransactionPostingStatus,
  TransactionSourceModule,
  TransactionSyncStatus,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import type { Database, Model } from "@nozbe/watermelondb";
import { describe, expect, it, vi } from "vitest";

type WhereClause = {
  type: "where";
  left: string;
  comparison: {
    operator: string;
    right?: {
      value?: unknown;
      values?: unknown[];
    };
  };
};

type MockTransactionRecord = {
  _raw: Record<string, number>;
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  accountDisplayNameSnapshot: string;
  transactionType: string;
  direction: string;
  title: string;
  amount: number;
  currencyCode: string | null;
  categoryRemoteId: string | null;
  categoryNameSnapshot: string | null;
  categoryLabel: string | null;
  note: string | null;
  happenedAt: number;
  settlementMoneyAccountRemoteId: string | null;
  settlementMoneyAccountDisplayNameSnapshot: string | null;
  sourceModule: string | null;
  sourceRemoteId: string | null;
  sourceAction: string | null;
  idempotencyKey: string | null;
  postingStatus: string;
  contactRemoteId: string | null;
  recordSyncStatus: string;
  lastSyncedAt: number | null;
  deletedAt: number | null;
  createdAt: Date;
  updatedAt: Date;
  update: (mutator: (record: Model) => void) => Promise<void>;
};

type MockMoneyAccountRecord = {
  _raw: Record<string, number>;
  remoteId: string;
  ownerUserRemoteId: string;
  scopeAccountRemoteId: string;
  name: string;
  accountType: string;
  currentBalance: number;
  description: string | null;
  currencyCode: string | null;
  isPrimary: boolean;
  isActive: boolean;
  recordSyncStatus: string;
  lastSyncedAt: number | null;
  deletedAt: number | null;
  createdAt: Date;
  updatedAt: Date;
  update: (mutator: (record: Model) => void) => Promise<void>;
};

type AuditExecuteResult = AuditResult<AuditEvent>;

const isWhereClause = (clause: unknown): clause is WhereClause =>
  typeof clause === "object" &&
  clause !== null &&
  "type" in clause &&
  (clause as { type?: string }).type === "where" &&
  "left" in clause;

const createTransactionRecord = (
  overrides: Partial<MockTransactionRecord> = {},
): MockTransactionRecord => {
  const createdAtMs = overrides.createdAt?.getTime() ?? 1_700_000_000_000;
  const updatedAtMs = overrides.updatedAt?.getTime() ?? createdAtMs;

  const record: MockTransactionRecord = {
    _raw: {
      created_at: createdAtMs,
      updated_at: updatedAtMs,
    },
    remoteId: overrides.remoteId ?? "",
    ownerUserRemoteId: overrides.ownerUserRemoteId ?? "user-1",
    accountRemoteId: overrides.accountRemoteId ?? "business-1",
    accountDisplayNameSnapshot: overrides.accountDisplayNameSnapshot ?? "Main Business",
    transactionType: overrides.transactionType ?? TransactionType.Income,
    direction: overrides.direction ?? TransactionDirection.In,
    title: overrides.title ?? "Money Movement",
    amount: overrides.amount ?? 0,
    currencyCode: overrides.currencyCode ?? "NPR",
    categoryRemoteId: overrides.categoryRemoteId ?? null,
    categoryNameSnapshot: overrides.categoryNameSnapshot ?? null,
    categoryLabel: overrides.categoryLabel ?? "General",
    note: overrides.note ?? null,
    happenedAt: overrides.happenedAt ?? 1_710_000_000_000,
    settlementMoneyAccountRemoteId:
      overrides.settlementMoneyAccountRemoteId ?? "cash-1",
    settlementMoneyAccountDisplayNameSnapshot:
      overrides.settlementMoneyAccountDisplayNameSnapshot ?? "Cash Drawer",
    sourceModule: overrides.sourceModule ?? TransactionSourceModule.Manual,
    sourceRemoteId: overrides.sourceRemoteId ?? null,
    sourceAction: overrides.sourceAction ?? null,
    idempotencyKey: overrides.idempotencyKey ?? null,
    postingStatus: overrides.postingStatus ?? TransactionPostingStatus.Posted,
    contactRemoteId: overrides.contactRemoteId ?? null,
    recordSyncStatus:
      overrides.recordSyncStatus ?? TransactionSyncStatus.PendingCreate,
    lastSyncedAt: overrides.lastSyncedAt ?? null,
    deletedAt: overrides.deletedAt ?? null,
    createdAt: overrides.createdAt ?? new Date(createdAtMs),
    updatedAt: overrides.updatedAt ?? new Date(updatedAtMs),
    update: vi.fn(async (mutator: (record: Model) => void) => {
      mutator(record as unknown as Model);
      record.createdAt = new Date(record._raw.created_at);
      record.updatedAt = new Date(record._raw.updated_at);
    }),
  };

  return record;
};

const createMoneyAccountRecord = (
  overrides: Partial<MockMoneyAccountRecord> = {},
): MockMoneyAccountRecord => {
  const updatedAtMs = overrides.updatedAt?.getTime() ?? 1_700_000_000_000;

  const record: MockMoneyAccountRecord = {
    _raw: {
      updated_at: updatedAtMs,
    },
    remoteId: overrides.remoteId ?? "cash-1",
    ownerUserRemoteId: overrides.ownerUserRemoteId ?? "user-1",
    scopeAccountRemoteId: overrides.scopeAccountRemoteId ?? "business-1",
    name: overrides.name ?? "Cash Drawer",
    accountType: overrides.accountType ?? MoneyAccountType.Cash,
    currentBalance: overrides.currentBalance ?? 0,
    description: overrides.description ?? null,
    currencyCode: overrides.currencyCode ?? "NPR",
    isPrimary: overrides.isPrimary ?? true,
    isActive: overrides.isActive ?? true,
    recordSyncStatus: overrides.recordSyncStatus ?? MoneyAccountSyncStatus.Synced,
    lastSyncedAt: overrides.lastSyncedAt ?? null,
    deletedAt: overrides.deletedAt ?? null,
    createdAt: overrides.createdAt ?? new Date(updatedAtMs),
    updatedAt: overrides.updatedAt ?? new Date(updatedAtMs),
    update: vi.fn(async (mutator: (record: Model) => void) => {
      mutator(record as unknown as Model);
      record.updatedAt = new Date(record._raw.updated_at);
    }),
  };

  return record;
};

const createPayload = (
  overrides: Partial<SaveTransactionPayload> = {},
): SaveTransactionPayload => ({
  remoteId: overrides.remoteId ?? "txn-1",
  ownerUserRemoteId: overrides.ownerUserRemoteId ?? "user-1",
  accountRemoteId: overrides.accountRemoteId ?? "business-1",
  accountDisplayNameSnapshot: overrides.accountDisplayNameSnapshot ?? "Main Business",
  transactionType: overrides.transactionType ?? TransactionType.Income,
  direction: overrides.direction ?? TransactionDirection.In,
  title: overrides.title ?? "Money Movement",
  amount: overrides.amount ?? 100,
  currencyCode: overrides.currencyCode ?? "NPR",
  categoryRemoteId: overrides.categoryRemoteId ?? null,
  categoryNameSnapshot: overrides.categoryNameSnapshot ?? null,
  categoryLabel: overrides.categoryLabel ?? "General",
  note: overrides.note ?? null,
  happenedAt: overrides.happenedAt ?? 1_710_000_000_000,
  settlementMoneyAccountRemoteId:
    overrides.settlementMoneyAccountRemoteId ?? "cash-1",
  settlementMoneyAccountDisplayNameSnapshot:
    overrides.settlementMoneyAccountDisplayNameSnapshot ?? "Cash Drawer",
  sourceModule: overrides.sourceModule ?? TransactionSourceModule.Pos,
  sourceRemoteId: overrides.sourceRemoteId ?? "source-1",
  sourceAction: overrides.sourceAction ?? "checkout_payment",
  idempotencyKey: overrides.idempotencyKey ?? "idem-1",
  postingStatus: overrides.postingStatus ?? TransactionPostingStatus.Posted,
  contactRemoteId: overrides.contactRemoteId ?? null,
});

const getWhereValue = (clause: WhereClause): unknown =>
  clause.comparison.right?.value;

const createAuditEvent = (): AuditEvent => ({
  remoteId: "audit-1",
  accountRemoteId: "business-1",
  ownerUserRemoteId: "user-1",
  actorUserRemoteId: "user-1",
  module: "transactions",
  action: "money_movement_posted",
  sourceModule: "transactions",
  sourceRemoteId: "txn-1",
  sourceAction: "post_money_movement",
  outcome: "success",
  severity: "info",
  summary: "Money movement posted",
  metadataJson: null,
  createdAt: 1_710_000_000_000,
  syncStatus: "pending",
  lastSyncedAt: null,
  deletedAt: null,
});

const createIntegrationHarness = ({
  transactions = [],
  moneyAccounts = [],
  auditResult = {
    success: true,
    value: createAuditEvent(),
  } satisfies AuditExecuteResult,
}: {
  transactions?: MockTransactionRecord[];
  moneyAccounts?: MockMoneyAccountRecord[];
  auditResult?: AuditExecuteResult;
}) => {
  const transactionRecords = [...transactions];
  const moneyAccountRecords = [...moneyAccounts];

  const transactionsCollection = {
    query: (...clauses: unknown[]) => ({
      fetch: async () => {
        let filtered = [...transactionRecords];

        for (const clause of clauses) {
          if (!isWhereClause(clause)) {
            continue;
          }

          const rightValue = getWhereValue(clause);

          if (clause.left === "remote_id" && typeof rightValue === "string") {
            filtered = filtered.filter((record) => record.remoteId === rightValue);
          }

          if (
            clause.left === "idempotency_key" &&
            typeof rightValue === "string"
          ) {
            filtered = filtered.filter(
              (record) => record.idempotencyKey === rightValue,
            );
          }

          if (clause.left === "deleted_at" && rightValue === null) {
            filtered = filtered.filter((record) => record.deletedAt === null);
          }
        }

        return filtered as unknown as Model[];
      },
    }),
    create: vi.fn(async (builder: (record: Model) => void) => {
      const now = Date.now();
      const record = createTransactionRecord({
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });

      builder(record as unknown as Model);
      record.createdAt = new Date(record._raw.created_at);
      record.updatedAt = new Date(record._raw.updated_at);
      transactionRecords.push(record);

      return record as unknown as Model;
    }),
  };

  const moneyAccountsCollection = {
    query: (...clauses: unknown[]) => ({
      fetch: async () => {
        let filtered = [...moneyAccountRecords];

        for (const clause of clauses) {
          if (!isWhereClause(clause)) {
            continue;
          }

          const rightValue = getWhereValue(clause);

          if (clause.left === "remote_id" && typeof rightValue === "string") {
            filtered = filtered.filter((record) => record.remoteId === rightValue);
          }

          if (clause.left === "is_active" && typeof rightValue === "boolean") {
            filtered = filtered.filter((record) => record.isActive === rightValue);
          }

          if (clause.left === "deleted_at" && rightValue === null) {
            filtered = filtered.filter((record) => record.deletedAt === null);
          }
        }

        return filtered as unknown as Model[];
      },
    }),
  };

  const database = {
    get: vi.fn((table: string) => {
      if (table === "transactions") {
        return transactionsCollection;
      }

      if (table === "money_accounts") {
        return moneyAccountsCollection;
      }

      throw new Error(`Unexpected table lookup: ${table}`);
    }),
    write: vi.fn(async (action: () => Promise<unknown>) => {
      const transactionSnapshot = [...transactionRecords];
      const moneyAccountSnapshot = [...moneyAccountRecords];

      try {
        return await action();
      } catch (error) {
        transactionRecords.splice(
          0,
          transactionRecords.length,
          ...transactionSnapshot,
        );
        moneyAccountRecords.splice(
          0,
          moneyAccountRecords.length,
          ...moneyAccountSnapshot,
        );
        throw error;
      }
    }),
  } as unknown as Database;

  const transactionDatasource = createLocalMoneyPostingDatasource(database);
  const moneyAccountBalanceDatasource =
    createLocalMoneyAccountBalanceDatasource(database);
  const workflowRepository = createMoneyPostingWorkflowRepository({
    transactionDatasource,
    moneyAccountBalanceDatasource,
  });
  const auditExecuteSpy = vi.fn(async () => auditResult);
  const workflowUseCase = createRunMoneyPostingWorkflowUseCase({
    workflowRepository,
    recordAuditEventUseCase: {
      execute: auditExecuteSpy,
    },
  });
  const repository = createMoneyPostingRepository(workflowUseCase);

  return {
    repository,
    auditExecuteSpy,
    transactionRecords,
    moneyAccountRecords,
  };
};

describe("moneyPosting.integration", () => {
  it("posts income money movement, updates the settlement balance, and saves source metadata", async () => {
    const harness = createIntegrationHarness({
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 0 })],
    });

    const result = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-income-1",
        amount: 100,
        sourceModule: TransactionSourceModule.Pos,
        sourceRemoteId: "pos-sale-1",
        sourceAction: "checkout_paid",
        idempotencyKey: "pos-sale-1-payment-1",
      }),
    );

    expect(result.success).toBe(true);
    expect(harness.transactionRecords).toHaveLength(1);
    expect(harness.moneyAccountRecords[0].currentBalance).toBe(100);
    expect(harness.transactionRecords[0]).toMatchObject({
      remoteId: "txn-income-1",
      amount: 100,
      postingStatus: TransactionPostingStatus.Posted,
      sourceModule: TransactionSourceModule.Pos,
      sourceRemoteId: "pos-sale-1",
      sourceAction: "checkout_paid",
      idempotencyKey: "pos-sale-1-payment-1",
    });

    if (result.success) {
      expect(result.value).toMatchObject({
        remoteId: "txn-income-1",
        amount: 100,
        postingStatus: TransactionPostingStatus.Posted,
      });
    }
  });

  it("posts expense money movement and reduces the settlement balance", async () => {
    const harness = createIntegrationHarness({
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 100 })],
    });

    const result = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-expense-1",
        transactionType: TransactionType.Expense,
        direction: TransactionDirection.Out,
        amount: 40,
        title: "Office supplies",
      }),
    );

    expect(result.success).toBe(true);
    expect(harness.transactionRecords).toHaveLength(1);
    expect(harness.moneyAccountRecords[0].currentBalance).toBe(60);
  });

  it("returns the existing transaction and does not mutate balance twice for the same idempotency key", async () => {
    const harness = createIntegrationHarness({
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 0 })],
    });

    const first = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-idem-original",
        amount: 100,
        idempotencyKey: "idem-shared-1",
      }),
    );
    const second = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-idem-duplicate",
        amount: 100,
        idempotencyKey: "idem-shared-1",
      }),
    );

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(harness.transactionRecords).toHaveLength(1);
    expect(harness.moneyAccountRecords[0].currentBalance).toBe(100);

    if (second.success) {
      expect(second.value.remoteId).toBe("txn-idem-original");
    }
  });

  it("reverses the old posted amount before applying an updated amount", async () => {
    const harness = createIntegrationHarness({
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 0 })],
    });

    const createResult = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-update-1",
        amount: 100,
      }),
    );
    const updateResult = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-update-1",
        amount: 150,
      }),
    );

    expect(createResult.success).toBe(true);
    expect(updateResult.success).toBe(true);
    expect(harness.transactionRecords).toHaveLength(1);
    expect(harness.moneyAccountRecords[0].currentBalance).toBe(150);
    expect(harness.transactionRecords[0].amount).toBe(150);
  });

  it("voids a posted money movement and restores the settlement balance", async () => {
    const harness = createIntegrationHarness({
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 0 })],
    });

    const postResult = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-void-1",
        amount: 100,
      }),
    );
    const voidResult = await harness.repository.deleteMoneyMovementByRemoteId(
      "txn-void-1",
    );

    expect(postResult.success).toBe(true);
    expect(voidResult).toEqual({ success: true, value: true });
    expect(harness.moneyAccountRecords[0].currentBalance).toBe(0);
    expect(harness.transactionRecords[0].postingStatus).toBe(
      TransactionPostingStatus.Voided,
    );
  });

  it("returns failure when audit recording fails after posting, while leaving the committed balance mutation visible", async () => {
    const harness = createIntegrationHarness({
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 0 })],
      auditResult: {
        success: false,
        error: {
          type: AuditErrorType.Database,
          message: "Unable to save audit event.",
        },
      },
    });

    const result = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-audit-failure-1",
        amount: 100,
        idempotencyKey: "idem-audit-failure-1",
      }),
    );

    expect(result.success).toBe(false);
    expect(harness.auditExecuteSpy).toHaveBeenCalledTimes(1);
    expect(harness.transactionRecords).toHaveLength(1);
    expect(harness.transactionRecords[0].remoteId).toBe("txn-audit-failure-1");
    expect(harness.moneyAccountRecords[0].currentBalance).toBe(100);

    if (!result.success) {
      expect(result.error.message).toContain(
        "Money movement posted, but audit event failed:",
      );
    }
  });
});
