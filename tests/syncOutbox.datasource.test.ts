import { createLocalSyncLocalDatasource } from "@/feature/sync/data/dataSource/local.syncLocal.datasource.impl";
import { SyncOperation } from "@/shared/sync/types/syncOperation.types";
import type { Database, Model } from "@nozbe/watermelondb";
import { describe, expect, it, vi } from "vitest";

type MockOutboxRecord = {
  remoteId: string;
  tableName: string;
  recordRemoteId: string;
  accountRemoteId: string;
  operation: string;
  payloadJson: string;
  status: string;
  attemptCount: number;
  lastAttemptedAt: number | null;
  createdAt: Date;
  updatedAt: Date;
  _raw: Record<string, number>;
  update: (mutator: (record: Model) => void) => Promise<void>;
};

const createOutboxRecord = (
  overrides: Partial<MockOutboxRecord> = {},
): MockOutboxRecord => {
  const now = 1_710_000_000_000;
  const record: MockOutboxRecord = {
    remoteId: overrides.remoteId ?? "sync-outbox-1",
    tableName: overrides.tableName ?? "contacts",
    recordRemoteId: overrides.recordRemoteId ?? "contact-1",
    accountRemoteId: overrides.accountRemoteId ?? "account-1",
    operation: overrides.operation ?? SyncOperation.Create,
    payloadJson: overrides.payloadJson ?? JSON.stringify({ remote_id: "contact-1" }),
    status: overrides.status ?? "pending",
    attemptCount: overrides.attemptCount ?? 0,
    lastAttemptedAt: overrides.lastAttemptedAt ?? null,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    _raw: {
      created_at: now,
      updated_at: now,
    },
    update: vi.fn(async (mutator: (record: Model) => void) => {
      mutator(record as unknown as Model);
      record.updatedAt = new Date(record._raw.updated_at);
    }),
  };

  return record;
};

const createDatabaseHarness = (records: MockOutboxRecord[] = []) => {
  const currentRecords = [...records];
  const create = vi.fn(async (builder: (record: Model) => void) => {
    const record = createOutboxRecord();
    builder(record as unknown as Model);
    currentRecords.push(record);
    return record as unknown as Model;
  });
  const fetch = vi.fn(async () => currentRecords as unknown as Model[]);
  const query = vi.fn(() => ({ fetch }));
  const collection = {
    query,
    create,
  };

  const database = {
    get: vi.fn(() => collection),
    write: vi.fn(async (action: () => Promise<unknown>) => action()),
  } as unknown as Database;

  return {
    database,
    create,
    fetch,
    records: currentRecords,
  };
};

describe("sync outbox datasource", () => {
  it("creates a pending outbox entry for a new local change", async () => {
    const harness = createDatabaseHarness();
    const datasource = createLocalSyncLocalDatasource(harness.database);

    const result = await datasource.queueOutboxRecord({
      tableName: "contacts",
      recordRemoteId: "contact-1",
      accountRemoteId: "account-1",
      operation: SyncOperation.Create,
      payload: { remote_id: "contact-1", full_name: "Hari" },
    });

    expect(result.success).toBe(true);
    expect(harness.create).toHaveBeenCalledTimes(1);
  });

  it("updates an existing outbox entry instead of creating a duplicate", async () => {
    const existing = createOutboxRecord();
    const harness = createDatabaseHarness([existing]);
    const datasource = createLocalSyncLocalDatasource(harness.database);

    const result = await datasource.queueOutboxRecord({
      tableName: "contacts",
      recordRemoteId: "contact-1",
      accountRemoteId: "account-1",
      operation: SyncOperation.Update,
      payload: { remote_id: "contact-1", full_name: "Hari Prasad" },
    });

    expect(result.success).toBe(true);
    expect(harness.create).toHaveBeenCalledTimes(0);
    expect(existing.update).toHaveBeenCalledTimes(1);
  });
});
