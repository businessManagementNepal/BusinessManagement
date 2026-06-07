import { createSyncRepository } from "@/feature/sync/data/repository/sync.repository.impl";
import type { SyncLocalDatasource } from "@/feature/sync/data/dataSource/syncLocal.datasource";
import type { SyncRemoteDatasource } from "@/feature/sync/data/dataSource/syncRemote.datasource";
import { SyncOutboxStatus } from "@/feature/sync/types/sync.constant";
import type { SyncChangeSetDto } from "@/feature/sync/types/sync.dto.types";
import type {
  SyncConflictRecord,
  SyncErrorRecord,
  SyncOutboxRecord,
  SyncRawRecord,
} from "@/feature/sync/types/sync.entity.types";
import { createPushPendingChangesUseCase } from "@/feature/sync/useCase/pushPendingChanges.useCase.impl";
import { SyncOperation } from "@/shared/sync/types/syncOperation.types";
import { SyncStatus } from "@/shared/sync/types/syncStatus.types";
import { describe, expect, it, vi } from "vitest";

const scope = {
  deviceId: "device-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "account-1",
  remoteOwnerUserRemoteId: "remote-user-1",
  remoteAccountRemoteId: "remote-account-1",
  schemaVersion: 49,
  syncRunRemoteId: "sync-run-1",
};

type HarnessAcknowledgement = {
  recordRemoteId: string;
  status: "accepted" | "rejected" | "conflict";
  serverRevision: string | null;
  errorCode?: string;
  errorMessage?: string;
  conflictPolicy?: "manual_review" | "version_based" | "client_wins";
};

type HarnessOptions = {
  recordsByTable?: Record<string, readonly SyncRawRecord[]>;
  existingOutbox?: readonly SyncOutboxRecord[];
  acknowledgementsByTable?: Record<string, readonly HarnessAcknowledgement[]>;
};

const createRecord = (
  overrides: Partial<SyncRawRecord> & {
    tableName: string;
    recordRemoteId: string;
    payload: Record<string, unknown>;
  },
): SyncRawRecord => ({
  tableName: overrides.tableName,
  recordRemoteId: overrides.recordRemoteId,
  accountRemoteId: overrides.accountRemoteId ?? scope.accountRemoteId,
  ownerUserRemoteId: overrides.ownerUserRemoteId ?? scope.ownerUserRemoteId,
  recordSyncStatus: overrides.recordSyncStatus ?? SyncStatus.PendingUpdate,
  lastSyncedAt: overrides.lastSyncedAt ?? 1,
  deletedAt: overrides.deletedAt ?? null,
  createdAt: overrides.createdAt ?? 1,
  updatedAt: overrides.updatedAt ?? 2,
  payload: overrides.payload,
});

const createOutboxRecord = (
  overrides: Partial<SyncOutboxRecord> & {
    tableName: string;
    recordRemoteId: string;
    payloadJson: string;
  },
): SyncOutboxRecord => ({
  remoteId: overrides.remoteId ?? `outbox-${overrides.tableName}-${overrides.recordRemoteId}`,
  tableName: overrides.tableName,
  recordRemoteId: overrides.recordRemoteId,
  accountRemoteId: overrides.accountRemoteId ?? scope.accountRemoteId,
  operation: overrides.operation ?? SyncOperation.Update,
  payloadJson: overrides.payloadJson,
  status: overrides.status ?? SyncOutboxStatus.Pending,
  attemptCount: overrides.attemptCount ?? 0,
  lastAttemptedAt: overrides.lastAttemptedAt ?? null,
  createdAt: overrides.createdAt ?? 1,
  updatedAt: overrides.updatedAt ?? 1,
});

const createHarness = (options: HarnessOptions = {}) => {
  const recordsByTable = new Map(
    Object.entries(options.recordsByTable ?? {}).map(([tableName, records]) => [
      tableName,
      [...records],
    ]),
  );
  const recordsByKey = new Map<string, SyncRawRecord>();
  recordsByTable.forEach((records) => {
    records.forEach((record) => {
      recordsByKey.set(`${record.tableName}:${record.recordRemoteId}`, record);
    });
  });

  const outboxByKey = new Map<string, SyncOutboxRecord>(
    (options.existingOutbox ?? []).map((record) => [
      `${record.tableName}:${record.recordRemoteId}`,
      { ...record },
    ]),
  );
  const pushCalls: Array<{
    tableName: string;
    changes: readonly {
      tableName: string;
      recordRemoteId: string;
      operation: string;
      payload: Record<string, unknown>;
    }[];
  }> = [];
  const queuedOutboxOrder: string[] = [];
  const syncErrors: SyncErrorRecord[] = [];
  const syncConflicts: SyncConflictRecord[] = [];

  const updateBusinessRecord = (
    tableName: string,
    recordRemoteId: string,
    status: string,
    lastSyncedAt: number | null,
    serverRevision?: string | null,
  ) => {
    const key = `${tableName}:${recordRemoteId}`;
    const existing = recordsByKey.get(key);
    if (!existing) {
      return;
    }

    const nextPayload =
      serverRevision === undefined
        ? existing.payload
        : {
            ...existing.payload,
            server_revision: serverRevision,
          };
    const updated: SyncRawRecord = {
      ...existing,
      recordSyncStatus: status,
      lastSyncedAt,
      updatedAt: (existing.updatedAt ?? 0) + 1,
      payload: nextPayload,
    };
    recordsByKey.set(key, updated);
    const tableRecords = recordsByTable.get(tableName);
    if (!tableRecords) {
      return;
    }

    const index = tableRecords.findIndex(
      (record) => record.recordRemoteId === recordRemoteId,
    );
    if (index !== -1) {
      tableRecords[index] = updated;
    }
  };

  const updateOutbox = (
    tableName: string,
    recordRemoteId: string,
    mutator: (record: SyncOutboxRecord) => SyncOutboxRecord,
  ) => {
    const key = `${tableName}:${recordRemoteId}`;
    const existing = outboxByKey.get(key);
    if (!existing) {
      return;
    }

    outboxByKey.set(key, mutator(existing));
  };

  const localDatasource: SyncLocalDatasource = {
    getPendingRecordsByTable: vi.fn(async ({ registryItem }) => ({
      success: true,
      value: [...(recordsByTable.get(registryItem.tableName) ?? [])],
    })),
    queueOutboxRecord: vi.fn(
      async ({ tableName, recordRemoteId, accountRemoteId, operation, payload }) => {
        const key = `${tableName}:${recordRemoteId}`;
        const payloadJson = JSON.stringify(payload);
        queuedOutboxOrder.push(tableName);

        const existing = outboxByKey.get(key);
        if (existing) {
          const updated: SyncOutboxRecord = {
            ...existing,
            accountRemoteId,
            operation,
            payloadJson,
            status: SyncOutboxStatus.Pending,
            updatedAt: existing.updatedAt + 1,
          };
          outboxByKey.set(key, updated);
          return {
            success: true as const,
            value: updated,
          };
        }

        const created = createOutboxRecord({
          tableName,
          recordRemoteId,
          accountRemoteId,
          operation,
          payloadJson,
        });
        outboxByKey.set(key, created);
        return {
          success: true as const,
          value: created,
        };
      },
    ),
    markRecordSynced: vi.fn(
      async ({ registryItem, recordRemoteId, accountRemoteId, lastSyncedAt, serverRevision }) => {
        updateBusinessRecord(
          registryItem.tableName,
          recordRemoteId,
          SyncStatus.Synced,
          lastSyncedAt ?? null,
          serverRevision,
        );
        updateOutbox(registryItem.tableName, recordRemoteId, (record) => ({
          ...record,
          accountRemoteId,
          status: SyncOutboxStatus.Synced,
          updatedAt: record.updatedAt + 1,
        }));
        return {
          success: true as const,
          value: true,
        };
      },
    ),
    markRecordSyncFailed: vi.fn(
      async ({ registryItem, recordRemoteId, accountRemoteId, serverRevision }) => {
        updateBusinessRecord(
          registryItem.tableName,
          recordRemoteId,
          SyncStatus.SyncFailed,
          null,
          serverRevision,
        );
        updateOutbox(registryItem.tableName, recordRemoteId, (record) => ({
          ...record,
          accountRemoteId,
          status: SyncOutboxStatus.Failed,
          updatedAt: record.updatedAt + 1,
        }));
        return {
          success: true as const,
          value: true,
        };
      },
    ),
    markRecordConflict: vi.fn(
      async ({ registryItem, recordRemoteId, accountRemoteId, serverRevision }) => {
        updateBusinessRecord(
          registryItem.tableName,
          recordRemoteId,
          SyncStatus.Conflict,
          null,
          serverRevision,
        );
        updateOutbox(registryItem.tableName, recordRemoteId, (record) => ({
          ...record,
          accountRemoteId,
          status: SyncOutboxStatus.Conflict,
          updatedAt: record.updatedAt + 1,
        }));
        return {
          success: true as const,
          value: true,
        };
      },
    ),
    recordSyncError: vi.fn(async (input) => {
      const record: SyncErrorRecord = {
        remoteId: `sync-error-${syncErrors.length + 1}`,
        syncRunRemoteId: input.syncRunRemoteId,
        tableName: input.tableName,
        recordRemoteId: input.recordRemoteId,
        operation: input.operation,
        errorType: input.errorType,
        errorMessage: input.errorMessage,
        retryCount: input.retryCount ?? 0,
        nextRetryAt: input.nextRetryAt ?? null,
        createdAt: 1,
        updatedAt: 1,
      };
      syncErrors.push(record);
      return {
        success: true as const,
        value: record,
      };
    }),
    recordSyncConflict: vi.fn(async (input) => {
      const record: SyncConflictRecord = {
        remoteId: `sync-conflict-${syncConflicts.length + 1}`,
        tableName: input.tableName,
        recordRemoteId: input.recordRemoteId,
        accountRemoteId: input.accountRemoteId,
        localPayloadJson: input.localPayloadJson,
        remotePayloadJson: input.remotePayloadJson,
        conflictPolicy: input.conflictPolicy,
        status: "open",
        createdAt: 1,
        updatedAt: 1,
      };
      syncConflicts.push(record);
      return {
        success: true as const,
        value: record,
      };
    }),
    getLocalRecord: vi.fn(async (_registryItem, recordRemoteId) => {
      for (const record of recordsByKey.values()) {
        if (record.recordRemoteId === recordRemoteId) {
          return {
            success: true as const,
            value: record,
          };
        }
      }

      return {
        success: true as const,
        value: null,
      };
    }),
  } as unknown as SyncLocalDatasource;

  const remoteDatasource: SyncRemoteDatasource = {
    pushChanges: vi.fn(async ({ changes }: { changes: readonly SyncChangeSetDto[] }) => {
      const tableName = changes[0]?.tableName ?? "unknown";
      pushCalls.push({
        tableName,
        changes: changes.map((change: SyncChangeSetDto) => ({
          tableName: change.tableName,
          recordRemoteId: change.recordRemoteId,
          operation: change.operation,
          payload: change.payload,
        })),
      });

      return {
        acknowledgements: (
          options.acknowledgementsByTable?.[tableName] ??
          changes.map((change: SyncChangeSetDto) => ({
            recordRemoteId: change.recordRemoteId,
            status: "accepted" as const,
            serverRevision: `rev-${change.recordRemoteId}`,
          }))
        ).map((acknowledgement: HarnessAcknowledgement) => ({
          tableName,
          ...acknowledgement,
        })),
      };
    }),
    pullChanges: vi.fn(),
  };

  const repository = createSyncRepository(localDatasource, remoteDatasource);
  const useCase = createPushPendingChangesUseCase(repository);

  return {
    useCase,
    localDatasource,
    recordsByKey,
    outboxByKey,
    pushCalls,
    queuedOutboxOrder,
    syncErrors,
    syncConflicts,
  };
};

describe("syncOutboxBusinessFlow.integration", () => {
  it("queues rollout-enabled business changes and pushes them in dependency order", async () => {
    const harness = createHarness({
      recordsByTable: {
        categories: [
          createRecord({
            tableName: "categories",
            recordRemoteId: "category-1",
            recordSyncStatus: SyncStatus.PendingCreate,
            lastSyncedAt: null,
            payload: {
              remote_id: "category-1",
              owner_user_remote_id: scope.ownerUserRemoteId,
              account_remote_id: scope.accountRemoteId,
              name: "Sales",
            },
          }),
        ],
        contacts: [
          createRecord({
            tableName: "contacts",
            recordRemoteId: "contact-1",
            payload: {
              remote_id: "contact-1",
              owner_user_remote_id: scope.ownerUserRemoteId,
              account_remote_id: scope.accountRemoteId,
              full_name: "Hari Prasad",
            },
          }),
        ],
        products: [
          createRecord({
            tableName: "products",
            recordRemoteId: "product-1",
            recordSyncStatus: SyncStatus.PendingCreate,
            lastSyncedAt: null,
            payload: {
              remote_id: "product-1",
              account_remote_id: scope.accountRemoteId,
              name: "Rice Bag",
              stock_quantity: 99,
              sale_price: 120,
            },
          }),
        ],
      },
    });

    const result = await harness.useCase.execute(scope);

    expect(result).toEqual({
      success: true,
      value: {
        pushedCount: 3,
        conflictCount: 0,
        failedCount: 0,
      },
    });
    expect(harness.queuedOutboxOrder).toEqual([
      "categories",
      "contacts",
      "products",
    ]);
    expect(harness.pushCalls.map((call) => call.tableName)).toEqual([
      "categories",
      "contacts",
      "products",
    ]);
    expect(harness.pushCalls[0]?.changes[0]?.payload).toMatchObject({
      remote_id: "category-1",
      owner_user_remote_id: scope.remoteOwnerUserRemoteId,
      account_remote_id: scope.remoteAccountRemoteId,
      name: "Sales",
    });
    expect(harness.pushCalls[2]?.changes[0]?.payload).toEqual(
      expect.objectContaining({
        remote_id: "product-1",
        account_remote_id: scope.remoteAccountRemoteId,
        name: "Rice Bag",
        sale_price: 120,
      }),
    );
    expect(harness.pushCalls[2]?.changes[0]?.payload).not.toHaveProperty(
      "stock_quantity",
    );
    expect(
      harness.outboxByKey.get("products:product-1")?.status,
    ).toBe(SyncOutboxStatus.Synced);
    expect(
      harness.recordsByKey.get("products:product-1")?.recordSyncStatus,
    ).toBe(SyncStatus.Synced);
  });

  it("reuses an existing outbox row when retrying a failed local change", async () => {
    const harness = createHarness({
      recordsByTable: {
        contacts: [
          createRecord({
            tableName: "contacts",
            recordRemoteId: "contact-1",
            recordSyncStatus: "failed",
            payload: {
              remote_id: "contact-1",
              owner_user_remote_id: scope.ownerUserRemoteId,
              account_remote_id: scope.accountRemoteId,
              full_name: "Hari Updated",
            },
          }),
        ],
      },
      existingOutbox: [
        createOutboxRecord({
          tableName: "contacts",
          recordRemoteId: "contact-1",
          operation: SyncOperation.Update,
          status: SyncOutboxStatus.Failed,
          payloadJson: JSON.stringify({
            remote_id: "contact-1",
            full_name: "Old Name",
          }),
        }),
      ],
    });

    const result = await harness.useCase.execute(scope);

    expect(result).toEqual({
      success: true,
      value: {
        pushedCount: 1,
        conflictCount: 0,
        failedCount: 0,
      },
    });
    expect(harness.outboxByKey.size).toBe(1);
    expect(harness.outboxByKey.get("contacts:contact-1")).toEqual(
      expect.objectContaining({
        status: SyncOutboxStatus.Synced,
        payloadJson: JSON.stringify({
          remote_id: "contact-1",
          owner_user_remote_id: scope.remoteOwnerUserRemoteId,
          account_remote_id: scope.remoteAccountRemoteId,
          full_name: "Hari Updated",
        }),
      }),
    );
    expect(harness.pushCalls).toHaveLength(1);
    expect(harness.localDatasource.queueOutboxRecord).toHaveBeenCalledTimes(1);
  });

  it("records conflict and remote rejection separately so retry state stays explicit", async () => {
    const harness = createHarness({
      recordsByTable: {
        contacts: [
          createRecord({
            tableName: "contacts",
            recordRemoteId: "contact-1",
            payload: {
              remote_id: "contact-1",
              owner_user_remote_id: scope.ownerUserRemoteId,
              account_remote_id: scope.accountRemoteId,
              full_name: "Hari Conflict",
            },
          }),
        ],
        products: [
          createRecord({
            tableName: "products",
            recordRemoteId: "product-1",
            payload: {
              remote_id: "product-1",
              account_remote_id: scope.accountRemoteId,
              name: "Rice Bag",
              sale_price: 120,
            },
          }),
        ],
      },
      acknowledgementsByTable: {
        contacts: [
          {
            recordRemoteId: "contact-1",
            status: "conflict",
            serverRevision: "rev-contact-1",
            conflictPolicy: "version_based",
          },
        ],
        products: [
          {
            recordRemoteId: "product-1",
            status: "rejected",
            serverRevision: "rev-product-1",
            errorCode: "REMOTE_REJECTED",
            errorMessage: "Remote validation rejected this product.",
          },
        ],
      },
    });

    const result = await harness.useCase.execute(scope);

    expect(result).toEqual({
      success: true,
      value: {
        pushedCount: 0,
        conflictCount: 1,
        failedCount: 1,
      },
    });
    expect(harness.syncConflicts).toHaveLength(1);
    expect(harness.syncErrors).toHaveLength(1);
    expect(harness.syncConflicts[0]).toEqual(
      expect.objectContaining({
        tableName: "contacts",
        recordRemoteId: "contact-1",
        conflictPolicy: "version_based",
      }),
    );
    expect(harness.syncErrors[0]).toEqual(
      expect.objectContaining({
        tableName: "products",
        recordRemoteId: "product-1",
        errorType: "REMOTE_REJECTED",
      }),
    );
    expect(
      harness.outboxByKey.get("contacts:contact-1")?.status,
    ).toBe(SyncOutboxStatus.Conflict);
    expect(
      harness.outboxByKey.get("products:product-1")?.status,
    ).toBe(SyncOutboxStatus.Failed);
    expect(
      harness.recordsByKey.get("contacts:contact-1")?.recordSyncStatus,
    ).toBe(SyncStatus.Conflict);
    expect(
      harness.recordsByKey.get("products:product-1")?.recordSyncStatus,
    ).toBe(SyncStatus.SyncFailed);
  });
});
