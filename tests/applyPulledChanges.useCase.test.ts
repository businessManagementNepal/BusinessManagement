import { createSyncRepository } from "@/feature/sync/data/repository/sync.repository.impl";
import type { SyncLocalDatasource } from "@/feature/sync/data/dataSource/syncLocal.datasource";
import type { SyncRemoteDatasource } from "@/feature/sync/data/dataSource/syncRemote.datasource";
import { createApplyPulledChangesUseCase } from "@/feature/sync/useCase/applyPulledChanges.useCase.impl";
import { SyncOperation } from "@/shared/sync/types/syncOperation.types";
import { describe, expect, it, vi } from "vitest";

const scope = {
  deviceId: "device-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "account-1",
  schemaVersion: 45,
};

describe("applyPulledChanges use case", () => {
  it("applies server updates to synced records and creates conflicts for pending local changes", async () => {
    const localDatasource: SyncLocalDatasource = {
      getLocalRecord: vi.fn(async (_registryItem, recordRemoteId) => ({
        success: true,
        value:
          recordRemoteId === "contact-pending"
            ? {
                tableName: "contacts",
                recordRemoteId,
                accountRemoteId: scope.accountRemoteId,
                ownerUserRemoteId: scope.ownerUserRemoteId,
                recordSyncStatus: "pending_update",
                lastSyncedAt: 1,
                deletedAt: null,
                createdAt: 1,
                updatedAt: 1,
                payload: { remote_id: recordRemoteId, full_name: "Local Pending" },
              }
            : {
                tableName: "contacts",
                recordRemoteId,
                accountRemoteId: scope.accountRemoteId,
                ownerUserRemoteId: scope.ownerUserRemoteId,
                recordSyncStatus: "synced",
                lastSyncedAt: 1,
                deletedAt: null,
                createdAt: 1,
                updatedAt: 1,
                payload: { remote_id: recordRemoteId, full_name: "Old Name" },
              },
      })),
      upsertPulledRecord: vi.fn(async (_registryItem, recordRemoteId, payload) => ({
        success: true,
        value: {
          tableName: "contacts",
          recordRemoteId,
          accountRemoteId: scope.accountRemoteId,
          ownerUserRemoteId: scope.ownerUserRemoteId,
          recordSyncStatus: "synced",
          lastSyncedAt: 2,
          deletedAt: null,
          createdAt: 1,
          updatedAt: 2,
          payload,
        },
      })),
      markRecordConflict: vi.fn(async () => ({ success: true, value: true })),
      recordSyncConflict: vi.fn(async () => ({
        success: true,
        value: {
          remoteId: "sync-conflict-1",
          tableName: "contacts",
          recordRemoteId: "contact-pending",
          accountRemoteId: scope.accountRemoteId,
          localPayloadJson: "{}",
          remotePayloadJson: "{}",
          conflictPolicy: "version_based",
          status: "open",
          createdAt: 1,
          updatedAt: 1,
        },
      })),
      tombstoneRecord: vi.fn(async () => ({ success: true, value: true })),
    } as unknown as SyncLocalDatasource;
    const remoteDatasource = {} as SyncRemoteDatasource;

    const repository = createSyncRepository(localDatasource, remoteDatasource);
    const useCase = createApplyPulledChangesUseCase(repository);

    const result = await useCase.execute(scope, {
      tables: [
        {
          tableName: "contacts",
          serverCursor: "cursor-1",
          changes: [
            {
              tableName: "contacts",
              operation: SyncOperation.Update,
              recordRemoteId: "contact-synced",
              payload: { remote_id: "contact-synced", full_name: "Server Name" },
              serverRevision: "rev-1",
              changedAt: 100,
            },
            {
              tableName: "contacts",
              operation: SyncOperation.Update,
              recordRemoteId: "contact-pending",
              payload: { remote_id: "contact-pending", full_name: "Remote Value" },
              serverRevision: "rev-2",
              changedAt: 101,
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.appliedCount).toBe(1);
    expect(result.value.conflictCount).toBe(1);
    expect(result.value.checkpointUpdates).toEqual([
      { tableName: "contacts", serverCursor: "cursor-1" },
    ]);
    expect(localDatasource.upsertPulledRecord).toHaveBeenCalledTimes(1);
    expect(localDatasource.recordSyncConflict).toHaveBeenCalledTimes(1);
  });

  it("uses tombstones for pulled deletes", async () => {
    const localDatasource: SyncLocalDatasource = {
      getLocalRecord: vi.fn(async () => ({
        success: true,
        value: {
          tableName: "contacts",
          recordRemoteId: "contact-delete",
          accountRemoteId: scope.accountRemoteId,
          ownerUserRemoteId: scope.ownerUserRemoteId,
          recordSyncStatus: "synced",
          lastSyncedAt: 1,
          deletedAt: null,
          createdAt: 1,
          updatedAt: 1,
          payload: { remote_id: "contact-delete" },
        },
      })),
      tombstoneRecord: vi.fn(async () => ({ success: true, value: true })),
      upsertPulledRecord: vi.fn(),
      markRecordConflict: vi.fn(),
      recordSyncConflict: vi.fn(),
    } as unknown as SyncLocalDatasource;
    const repository = createSyncRepository(
      localDatasource,
      {} as SyncRemoteDatasource,
    );
    const useCase = createApplyPulledChangesUseCase(repository);

    const result = await useCase.execute(scope, {
      tables: [
        {
          tableName: "contacts",
          serverCursor: "cursor-delete",
          changes: [
            {
              tableName: "contacts",
              operation: SyncOperation.Delete,
              recordRemoteId: "contact-delete",
              payload: { remote_id: "contact-delete", deleted_at: 999 },
              serverRevision: "rev-delete",
              changedAt: 999,
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(localDatasource.tombstoneRecord).toHaveBeenCalledWith(
      expect.any(Object),
      "contact-delete",
      999,
    );
  });
});
