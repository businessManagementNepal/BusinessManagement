import { createSyncRepository } from "@/feature/sync/data/repository/sync.repository.impl";
import type { SyncLocalDatasource } from "@/feature/sync/data/dataSource/syncLocal.datasource";
import type { SyncRemoteDatasource } from "@/feature/sync/data/dataSource/syncRemote.datasource";
import { createPushPendingChangesUseCase } from "@/feature/sync/useCase/pushPendingChanges.useCase.impl";
import { SyncOperation } from "@/shared/sync/types/syncOperation.types";
import { describe, expect, it, vi } from "vitest";

const scope = {
  deviceId: "device-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "account-1",
  schemaVersion: 45,
  syncRunRemoteId: "sync-run-1",
};

const createLocalDatasourceMock = (): SyncLocalDatasource => ({
  getPendingRecordsByTable: vi.fn(async ({ registryItem }) => {
    if (registryItem.tableName === "contacts") {
      return {
        success: true,
        value: [
          {
            tableName: "contacts",
            recordRemoteId: "contact-create",
            accountRemoteId: scope.accountRemoteId,
            ownerUserRemoteId: scope.ownerUserRemoteId,
            recordSyncStatus: "pending_create",
            lastSyncedAt: null,
            deletedAt: null,
            createdAt: 1,
            updatedAt: 1,
            payload: { remote_id: "contact-create", full_name: "New Contact" },
          },
          {
            tableName: "contacts",
            recordRemoteId: "contact-update",
            accountRemoteId: scope.accountRemoteId,
            ownerUserRemoteId: scope.ownerUserRemoteId,
            recordSyncStatus: "pending_update",
            lastSyncedAt: 1,
            deletedAt: null,
            createdAt: 1,
            updatedAt: 2,
            payload: { remote_id: "contact-update", full_name: "Updated Contact" },
          },
          {
            tableName: "contacts",
            recordRemoteId: "contact-delete",
            accountRemoteId: scope.accountRemoteId,
            ownerUserRemoteId: scope.ownerUserRemoteId,
            recordSyncStatus: "pending_delete",
            lastSyncedAt: 1,
            deletedAt: 2,
            createdAt: 1,
            updatedAt: 2,
            payload: { remote_id: "contact-delete", deleted_at: 2 },
          },
          {
            tableName: "contacts",
            recordRemoteId: "contact-retry",
            accountRemoteId: scope.accountRemoteId,
            ownerUserRemoteId: scope.ownerUserRemoteId,
            recordSyncStatus: "failed",
            lastSyncedAt: 1,
            deletedAt: null,
            createdAt: 1,
            updatedAt: 3,
            payload: { remote_id: "contact-retry", full_name: "Retry Contact" },
          },
        ],
      };
    }

    return { success: true, value: [] };
  }),
  queueOutboxRecord: vi.fn(async ({ tableName, recordRemoteId, accountRemoteId, operation, payload }) => ({
    success: true,
    value: {
      remoteId: `outbox-${recordRemoteId}`,
      tableName,
      recordRemoteId,
      accountRemoteId,
      operation,
      payloadJson: JSON.stringify(payload),
      status: "pending",
      attemptCount: 0,
      lastAttemptedAt: null,
      createdAt: 1,
      updatedAt: 1,
    },
  })),
  markRecordSynced: vi.fn(async () => ({ success: true, value: true })),
  markRecordSyncFailed: vi.fn(async () => ({ success: true, value: true })),
  markRecordConflict: vi.fn(async () => ({ success: true, value: true })),
  recordSyncError: vi.fn(async () => ({
    success: true,
    value: {
      remoteId: "sync-error-1",
      syncRunRemoteId: scope.syncRunRemoteId,
      tableName: "contacts",
      recordRemoteId: "contact-retry",
      operation: SyncOperation.Update,
      errorType: "REMOTE_REJECTED",
      errorMessage: "Rejected",
      retryCount: 0,
      nextRetryAt: null,
      createdAt: 1,
      updatedAt: 1,
    },
  })),
  recordSyncConflict: vi.fn(async () => ({
    success: true,
    value: {
      remoteId: "sync-conflict-1",
      tableName: "contacts",
      recordRemoteId: "contact-update",
      accountRemoteId: scope.accountRemoteId,
      localPayloadJson: "{}",
      remotePayloadJson: "{}",
      conflictPolicy: "manual_review",
      status: "open",
      createdAt: 1,
      updatedAt: 1,
    },
  })),
  getLocalRecord: vi.fn(async (_registryItem, recordRemoteId) => ({
    success: true,
    value: {
      tableName: "contacts",
      recordRemoteId,
      accountRemoteId: scope.accountRemoteId,
      ownerUserRemoteId: scope.ownerUserRemoteId,
      recordSyncStatus: "pending_update",
      lastSyncedAt: 1,
      deletedAt: null,
      createdAt: 1,
      updatedAt: 1,
      payload: { remote_id: recordRemoteId },
    },
  })),
} as unknown as SyncLocalDatasource);

describe("pushPendingChanges use case", () => {
  it("pushes create, update, delete, and retry records and marks accepted ones as synced", async () => {
    const localDatasource = createLocalDatasourceMock();
    const remoteDatasource: SyncRemoteDatasource = {
      pushChanges: vi.fn(async ({ changes }) => ({
        acknowledgements: changes.map((change: { tableName: string; recordRemoteId: string }) => ({
          tableName: change.tableName,
          recordRemoteId: change.recordRemoteId,
          status: "accepted" as const,
          serverRevision: "rev-1",
        })),
      })),
      pullChanges: vi.fn(),
    };
    const repository = createSyncRepository(localDatasource, remoteDatasource);
    const useCase = createPushPendingChangesUseCase(repository);

    const result = await useCase.execute(scope);

    expect(result).toEqual({
      success: true,
      value: {
        pushedCount: 4,
        conflictCount: 0,
        failedCount: 0,
      },
    });
    expect(remoteDatasource.pushChanges).toHaveBeenCalled();
    expect(localDatasource.markRecordSynced).toHaveBeenCalledTimes(4);
  });
});
