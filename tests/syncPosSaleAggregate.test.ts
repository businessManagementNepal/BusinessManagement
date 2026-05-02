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

describe("sync POS sale aggregate safety", () => {
  it("creates a conflict instead of silently overwriting a posted POS sale", async () => {
    const localDatasource: SyncLocalDatasource = {
      getLocalRecord: vi.fn(async () => ({
        success: true,
        value: {
          tableName: "pos_sales",
          recordRemoteId: "pos-1",
          accountRemoteId: scope.accountRemoteId,
          ownerUserRemoteId: scope.ownerUserRemoteId,
          recordSyncStatus: "synced",
          lastSyncedAt: 1,
          deletedAt: null,
          createdAt: 1,
          updatedAt: 1,
          payload: {
            remote_id: "pos-1",
            workflow_status: "posted",
            receipt_number: "RCPT-1",
            grand_total: 500,
            posted_transaction_remote_ids_json: "[\"txn-1\"]",
          },
        },
      })),
      markRecordConflict: vi.fn(async () => ({ success: true, value: true })),
      recordSyncConflict: vi.fn(async () => ({
        success: true,
        value: {
          remoteId: "sync-conflict-1",
          tableName: "pos_sales",
          recordRemoteId: "pos-1",
          accountRemoteId: scope.accountRemoteId,
          localPayloadJson: "{}",
          remotePayloadJson: "{}",
          conflictPolicy: "manual_review",
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
          tableName: "pos_sales",
          serverCursor: "pos-cursor",
          changes: [
            {
              tableName: "pos_sales",
              operation: SyncOperation.Update,
              recordRemoteId: "pos-1",
              payload: {
                remote_id: "pos-1",
                workflow_status: "posted",
                receipt_number: "RCPT-1",
                grand_total: 650,
                posted_transaction_remote_ids_json: "[\"txn-1\",\"txn-2\"]",
              },
              serverRevision: "rev-2",
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
