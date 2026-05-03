import { createLocalSyncLocalDatasource } from "@/feature/sync/data/dataSource/local.syncLocal.datasource.impl";
import type { Database } from "@nozbe/watermelondb";
import { describe, expect, it, vi } from "vitest";

const scope = {
  ownerUserRemoteId: "owner-1",
  accountRemoteId: "account-1",
  deviceId: "device-1",
  schemaVersion: 51,
};

const buildPendingRow = (tableName: string, recordRemoteId: string) => ({
  id: `${tableName}-row-1`,
  remote_id: recordRemoteId,
  account_remote_id: scope.accountRemoteId,
  owner_user_remote_id: scope.ownerUserRemoteId,
  sync_status: "pending_update",
  last_synced_at: null,
  deleted_at: null,
  created_at: 1,
  updated_at: 2,
  __record_remote_id: recordRemoteId,
  __account_remote_id: scope.accountRemoteId,
  __owner_user_remote_id: scope.ownerUserRemoteId,
  __record_sync_status: "pending_update",
  __last_synced_at: null,
  __deleted_at: null,
});

const buildSyncRunModel = () => ({
  remoteId: "sync-run-1",
  ownerUserRemoteId: scope.ownerUserRemoteId,
  accountRemoteId: scope.accountRemoteId,
  status: "completed",
  startedAt: 100,
  finishedAt: 200,
  pushedCount: 1,
  pulledCount: 1,
  conflictCount: 0,
  failedCount: 0,
  errorMessage: null,
  createdAt: new Date(100),
  updatedAt: new Date(200),
});

const createDatabaseHarness = () => {
  const sqlQueries: string[] = [];

  const queryRaw = vi.fn(async (query: { sql: string }) => {
    sqlQueries.push(query.sql);

    if (query.sql.startsWith('PRAGMA table_info("contacts")')) {
      return [
        { name: "id" },
        { name: "remote_id" },
        { name: "account_remote_id" },
        { name: "owner_user_remote_id" },
        { name: "sync_status" },
        { name: "last_synced_at" },
        { name: "deleted_at" },
        { name: "created_at" },
        { name: "updated_at" },
      ];
    }

    if (query.sql.startsWith('PRAGMA table_info("categories")')) {
      return [
        { name: "id" },
        { name: "remote_id" },
        { name: "account_remote_id" },
        { name: "owner_user_remote_id" },
        { name: "sync_status" },
        { name: "last_synced_at" },
        { name: "deleted_at" },
        { name: "created_at" },
        { name: "updated_at" },
      ];
    }

    if (query.sql.startsWith('PRAGMA table_info("products")')) {
      return [
        { name: "id" },
        { name: "remote_id" },
        { name: "account_remote_id" },
        { name: "owner_user_remote_id" },
        { name: "sync_status" },
        { name: "last_synced_at" },
        { name: "deleted_at" },
        { name: "created_at" },
        { name: "updated_at" },
      ];
    }

    if (query.sql.includes('FROM "contacts" child')) {
      return [buildPendingRow("contacts", "contact-1")];
    }

    if (query.sql.includes('FROM "categories" child')) {
      return [];
    }

    if (query.sql.includes('FROM "products" child')) {
      return [];
    }

    if (query.sql.includes('FROM "transactions" child')) {
      return [buildPendingRow("transactions", "txn-1")];
    }

    return [];
  });

  const rawCollection = {
    query: vi.fn((query: { sql: string }) => ({
      unsafeFetchRaw: () => queryRaw(query),
    })),
  };

  const syncConflictsCollection = {
    query: vi.fn(() => ({
      fetch: vi.fn(async () => []),
    })),
  };

  const syncRunsCollection = {
    query: vi.fn(() => ({
      fetchCount: vi.fn(async () => 0),
      fetch: vi.fn(async () => [buildSyncRunModel()]),
    })),
  };

  const database = {
    get: vi.fn((tableName: string) => {
      if (tableName === "sync_conflicts") {
        return syncConflictsCollection;
      }

      if (tableName === "sync_runs") {
        return syncRunsCollection;
      }

      return rawCollection;
    }),
  } as unknown as Database;

  return {
    database,
    sqlQueries,
  };
};

describe("sync status datasource", () => {
  it("counts only V1 rollout tables in the pending summary", async () => {
    const harness = createDatabaseHarness();
    const datasource = createLocalSyncLocalDatasource(harness.database);

    const result = await datasource.getSyncStatusSummary(scope);

    expect(result).toEqual({
      success: true,
      value: {
        lastSyncedAt: 200,
        pendingChangesCount: 1,
        failedRecordsCount: 0,
        conflictCount: 0,
        isRunning: false,
      },
    });
    expect(harness.sqlQueries.some((sql) => sql.includes('FROM "transactions" child'))).toBe(
      false,
    );
  });
});
