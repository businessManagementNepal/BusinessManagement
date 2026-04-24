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
    accountDisplayNameSnapshot: overrides.accountDisplayNameSnapshot ?? "Main",
    transactionType: overrides.transactionType ?? TransactionType.Income,
    direction: overrides.direction ?? TransactionDirection.In,
    title: overrides.title ?? "Movement",
    amount: overrides.amount ?? 0,
    currencyCode: overrides.currencyCode ?? "NPR",
    categoryLabel: overrides.categoryLabel ?? "General",
    note: overrides.note ?? null,
    happenedAt: overrides.happenedAt ?? 1_710_000_000_000,
    settlementMoneyAccountRemoteId:
      overrides.settlementMoneyAccountRemoteId ?? "cash-1",
    settlementMoneyAccountDisplayNameSnapshot:
      overrides.settlementMoneyAccountDisplayNameSnapshot ?? "Cash",
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
  title: overrides.title ?? "Movement",
  amount: overrides.amount ?? 100,
  currencyCode: overrides.currencyCode ?? "NPR",
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
});

const getMockCallCount = (fn: unknown): number => {
  const withMock = fn as { mock?: { calls?: unknown[] } };
  return withMock.mock?.calls?.length ?? 0;
};

const findMoneyAccountByRemoteId = (
  records: MockMoneyAccountRecord[],
  remoteId: string,
): MockMoneyAccountRecord => {
  const record = records.find((item) => item.remoteId === remoteId);
  if (!record) {
    throw new Error(`Expected money account ${remoteId} to exist in test harness.`);
  }

  return record;
};

const createDatasourceHarness = ({
  transactions = [],
  moneyAccounts = [],
}: {
  transactions?: MockTransactionRecord[];
  moneyAccounts?: MockMoneyAccountRecord[];
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

          const rightValue = clause.comparison.right?.value;

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

          const rightValue = clause.comparison.right?.value;

          if (clause.left === "remote_id" && typeof rightValue === "string") {
            filtered = filtered.filter((record) => record.remoteId === rightValue);
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
  const workflowUseCase = createRunMoneyPostingWorkflowUseCase({
    workflowRepository,
  });
  const repository = createMoneyPostingRepository(workflowUseCase);

  return {
    repository,
    transactionRecords,
    moneyAccountRecords,
    transactionsCreateSpy: transactionsCollection.create,
    databaseWriteSpy: database.write,
  };
};

describe("moneyPosting.repository", () => {
  it("creates a new transaction and posts the balance delta exactly once", async () => {
    const harness = createDatasourceHarness({
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 500 })],
    });
    const cashAccount = harness.moneyAccountRecords[0];

    const result = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-create-delta",
        amount: 75,
      }),
    );

    expect(result.success).toBe(true);
    expect(harness.transactionRecords).toHaveLength(1);
    expect(cashAccount.currentBalance).toBe(575);
    expect(getMockCallCount(harness.transactionsCreateSpy)).toBe(1);
    expect(getMockCallCount(cashAccount.update)).toBe(1);
    expect(getMockCallCount(harness.databaseWriteSpy)).toBe(1);
  });

  it("updates an existing transaction by reversing old effect and applying new effect exactly once", async () => {
    const existing = createTransactionRecord({
      remoteId: "txn-update-delta",
      amount: 50,
      settlementMoneyAccountRemoteId: "cash-1",
      postingStatus: TransactionPostingStatus.Posted,
      recordSyncStatus: TransactionSyncStatus.Synced,
    });
    const harness = createDatasourceHarness({
      transactions: [existing],
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 500 })],
    });
    const cashAccount = harness.moneyAccountRecords[0];

    const result = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-update-delta",
        amount: 80,
      }),
    );

    expect(result.success).toBe(true);
    expect(cashAccount.currentBalance).toBe(530);
    expect(getMockCallCount(existing.update)).toBe(1);
    expect(getMockCallCount(cashAccount.update)).toBe(2);
    expect(getMockCallCount(harness.transactionsCreateSpy)).toBe(0);
  });

  it("returns the existing active transaction for matching idempotency key without second balance mutation", async () => {
    const existing = createTransactionRecord({
      remoteId: "txn-existing",
      amount: 90,
      idempotencyKey: "idem-1",
      postingStatus: TransactionPostingStatus.Posted,
      settlementMoneyAccountRemoteId: "cash-1",
    });
    const harness = createDatasourceHarness({
      transactions: [existing],
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 800 })],
    });
    const cashAccount = harness.moneyAccountRecords[0];

    const result = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-new",
        amount: 50,
        idempotencyKey: "idem-1",
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.remoteId).toBe("txn-existing");
    }
    expect(harness.transactionRecords).toHaveLength(1);
    expect(cashAccount.currentBalance).toBe(800);
    expect(getMockCallCount(harness.transactionsCreateSpy)).toBe(0);
    expect(getMockCallCount(existing.update)).toBe(0);
    expect(getMockCallCount(cashAccount.update)).toBe(0);
  });

  it("voids once and remains idempotent on repeated void attempt", async () => {
    const existing = createTransactionRecord({
      remoteId: "txn-delete",
      amount: 120,
      direction: TransactionDirection.In,
      postingStatus: TransactionPostingStatus.Posted,
      settlementMoneyAccountRemoteId: "cash-1",
      recordSyncStatus: TransactionSyncStatus.Synced,
    });
    const harness = createDatasourceHarness({
      transactions: [existing],
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 500 })],
    });
    const cashAccount = harness.moneyAccountRecords[0];

    const firstResult = await harness.repository.deleteMoneyMovementByRemoteId(
      "txn-delete",
    );
    const secondResult = await harness.repository.deleteMoneyMovementByRemoteId(
      "txn-delete",
    );

    expect(firstResult).toEqual({ success: true, value: true });
    expect(secondResult).toEqual({ success: true, value: true });
    expect(existing.postingStatus).toBe(TransactionPostingStatus.Voided);
    expect(existing.deletedAt).toBeNull();
    expect(cashAccount.currentBalance).toBe(380);
    expect(getMockCallCount(existing.update)).toBe(1);
    expect(getMockCallCount(cashAccount.update)).toBe(1);
  });

  it("reverses old account and applies new account when settlement account changes", async () => {
    const existing = createTransactionRecord({
      remoteId: "txn-account-change",
      amount: 100,
      direction: TransactionDirection.In,
      postingStatus: TransactionPostingStatus.Posted,
      settlementMoneyAccountRemoteId: "cash-1",
      recordSyncStatus: TransactionSyncStatus.Synced,
    });
    const harness = createDatasourceHarness({
      transactions: [existing],
      moneyAccounts: [
        createMoneyAccountRecord({
          remoteId: "cash-1",
          currentBalance: 1_000,
        }),
        createMoneyAccountRecord({
          remoteId: "bank-1",
          currentBalance: 200,
          accountType: MoneyAccountType.Bank,
        }),
      ],
    });
    const cashAccount = findMoneyAccountByRemoteId(
      harness.moneyAccountRecords,
      "cash-1",
    );
    const bankAccount = findMoneyAccountByRemoteId(
      harness.moneyAccountRecords,
      "bank-1",
    );

    const result = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-account-change",
        amount: 150,
        settlementMoneyAccountRemoteId: "bank-1",
      }),
    );

    expect(result.success).toBe(true);
    expect(cashAccount.currentBalance).toBe(900);
    expect(bankAccount.currentBalance).toBe(350);
    expect(getMockCallCount(cashAccount.update)).toBe(1);
    expect(getMockCallCount(bankAccount.update)).toBe(1);
    expect(getMockCallCount(existing.update)).toBe(1);
  });

  it("persists contactRemoteId on create and preserves it through domain mapping", async () => {
    const harness = createDatasourceHarness({
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 500 })],
    });

    const result = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-create-contact",
        amount: 75,
        contactRemoteId: "contact-1",
      }),
    );

    expect(result.success).toBe(true);
    expect(harness.transactionRecords).toHaveLength(1);
    expect(harness.transactionRecords[0].contactRemoteId).toBe("contact-1");

    if (result.success) {
      expect(result.value.contactRemoteId).toBe("contact-1");
    }
  });

  it("persists changed contactRemoteId on update", async () => {
    const existing = createTransactionRecord({
      remoteId: "txn-update-contact",
      amount: 50,
      contactRemoteId: "contact-old",
      settlementMoneyAccountRemoteId: "cash-1",
      postingStatus: TransactionPostingStatus.Posted,
      recordSyncStatus: TransactionSyncStatus.Synced,
    });
    const harness = createDatasourceHarness({
      transactions: [existing],
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 500 })],
    });

    const result = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-update-contact",
        amount: 80,
        contactRemoteId: "contact-new",
      }),
    );

    expect(result.success).toBe(true);
    expect(existing.contactRemoteId).toBe("contact-new");
  });

  it("stores null contactRemoteId when caller omits it", async () => {
    const harness = createDatasourceHarness({
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 200 })],
    });
    const payloadWithoutContact = createPayload({
      remoteId: "txn-no-contact",
      amount: 25,
    });

    delete (payloadWithoutContact as { contactRemoteId?: string | null })
      .contactRemoteId;

    const result =
      await harness.repository.postMoneyMovement(payloadWithoutContact);

    expect(result.success).toBe(true);
    expect(harness.transactionRecords[0].contactRemoteId).toBeNull();
  });

  it("keeps money-account balance behavior unchanged regardless of contactRemoteId", async () => {
    const withContact = createDatasourceHarness({
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 300 })],
    });
    const withoutContact = createDatasourceHarness({
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 300 })],
    });

    const withContactResult = await withContact.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-with-contact",
        amount: 45,
        contactRemoteId: "contact-1",
      }),
    );
    const withoutContactResult =
      await withoutContact.repository.postMoneyMovement(
        createPayload({
          remoteId: "txn-without-contact",
          amount: 45,
          contactRemoteId: null,
        }),
      );

    expect(withContactResult.success).toBe(true);
    expect(withoutContactResult.success).toBe(true);
    expect(withContact.moneyAccountRecords[0].currentBalance).toBe(345);
    expect(withoutContact.moneyAccountRecords[0].currentBalance).toBe(345);
  });

  it("fails when settlement account is missing and does not leave partial writes", async () => {
    const harness = createDatasourceHarness({
      moneyAccounts: [],
    });

    const result = await harness.repository.postMoneyMovement(
      createPayload({
        remoteId: "txn-missing-settlement",
        amount: 25,
        settlementMoneyAccountRemoteId: "missing-account",
      }),
    );

    expect(result.success).toBe(false);
    expect(harness.transactionRecords).toHaveLength(0);
    expect(getMockCallCount(harness.transactionsCreateSpy)).toBe(1);
    expect(getMockCallCount(harness.databaseWriteSpy)).toBe(1);
  });

  it("returns false when deleting a non-voided soft-deleted transaction", async () => {
    const existing = createTransactionRecord({
      remoteId: "txn-soft-deleted",
      amount: 80,
      postingStatus: TransactionPostingStatus.Posted,
      deletedAt: 1_700_000_000_000,
      settlementMoneyAccountRemoteId: "cash-1",
    });
    const harness = createDatasourceHarness({
      transactions: [existing],
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 400 })],
    });

    const result = await harness.repository.deleteMoneyMovementByRemoteId(
      "txn-soft-deleted",
    );

    expect(result).toEqual({ success: true, value: false });
    expect(harness.moneyAccountRecords[0].currentBalance).toBe(400);
    expect(existing.postingStatus).toBe(TransactionPostingStatus.Posted);
  });

  it("returns true for already-voided transactions without balance mutation", async () => {
    const existing = createTransactionRecord({
      remoteId: "txn-voided",
      amount: 60,
      postingStatus: TransactionPostingStatus.Voided,
      deletedAt: 1_700_000_000_000,
      settlementMoneyAccountRemoteId: "cash-1",
    });
    const harness = createDatasourceHarness({
      transactions: [existing],
      moneyAccounts: [createMoneyAccountRecord({ currentBalance: 400 })],
    });

    const result = await harness.repository.deleteMoneyMovementByRemoteId(
      "txn-voided",
    );

    expect(result).toEqual({ success: true, value: true });
    expect(harness.moneyAccountRecords[0].currentBalance).toBe(400);
    expect(existing.postingStatus).toBe(TransactionPostingStatus.Voided);
  });
});
