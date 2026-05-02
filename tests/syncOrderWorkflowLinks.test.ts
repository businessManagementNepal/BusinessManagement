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

describe("sync order workflow safety", () => {
  it("protects delivered orders from being silently reverted by sync", async () => {
    const localDatasource: SyncLocalDatasource = {
      getLocalRecord: vi.fn(async () => ({
        success: true,
        value: {
          tableName: "orders",
          recordRemoteId: "order-1",
          accountRemoteId: scope.accountRemoteId,
          ownerUserRemoteId: scope.ownerUserRemoteId,
          recordSyncStatus: "synced",
          lastSyncedAt: 1,
          deletedAt: null,
          createdAt: 1,
          updatedAt: 1,
          payload: {
            remote_id: "order-1",
            status: "delivered",
            linked_billing_document_remote_id: "bill-1",
            linked_ledger_due_entry_remote_id: "ledger-1",
          },
        },
      })),
      markRecordConflict: vi.fn(async () => ({ success: true, value: true })),
      recordSyncConflict: vi.fn(async () => ({
        success: true,
        value: {
          remoteId: "sync-conflict-1",
          tableName: "orders",
          recordRemoteId: "order-1",
          accountRemoteId: scope.accountRemoteId,
          localPayloadJson: "{}",
          remotePayloadJson: "{}",
          conflictPolicy: "version_based",
          status: "open",
          createdAt: 1,
          updatedAt: 1,
        },
      })),
      upsertPulledRecord: vi.fn(),
      tombstoneRecord: vi.fn(),
    } as unknown as SyncLocalDatasource;

    const repository = createSyncRepository(
      localDatasource,
      {} as SyncRemoteDatasource,
    );
    const useCase = createApplyPulledChangesUseCase(repository);

    const result = await useCase.execute(scope, {
      tables: [
        {
          tableName: "orders",
          serverCursor: "order-cursor",
          changes: [
            {
              tableName: "orders",
              operation: SyncOperation.Update,
              recordRemoteId: "order-1",
              payload: {
                remote_id: "order-1",
                status: "draft",
                linked_billing_document_remote_id: "bill-1",
                linked_ledger_due_entry_remote_id: "ledger-1",
              },
              serverRevision: "rev-1",
              changedAt: 10,
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.conflictCount).toBe(1);
    expect(localDatasource.upsertPulledRecord).not.toHaveBeenCalled();
  });
});
