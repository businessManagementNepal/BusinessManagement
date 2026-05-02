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
  schemaVersion: 49,
};

describe("sync server revision strategy", () => {
  it("stores server_revision from accepted push acknowledgements", async () => {
    const localDatasource = {
      markRecordSynced: vi.fn(async () => ({ success: true as const, value: true })),
    } as unknown as SyncLocalDatasource;
    const repository = createSyncRepository(
      localDatasource,
      {} as SyncRemoteDatasource,
    );

    const result = await repository.applyPushAcknowledgements(scope, "sync-run-1", [
      {
        tableName: "contacts",
        recordRemoteId: "contact-1",
        status: "accepted",
        serverRevision: "rev-2",
      },
    ]);

    expect(result.success).toBe(true);
    expect(localDatasource.markRecordSynced).toHaveBeenCalledWith(
      expect.objectContaining({
        recordRemoteId: "contact-1",
        accountRemoteId: scope.accountRemoteId,
        serverRevision: "rev-2",
      }),
    );
  });

  it("stores server_revision on pulled upserts", async () => {
    const localDatasource: SyncLocalDatasource = {
      getLocalRecord: vi.fn(async () => ({ success: true, value: null })),
      upsertPulledRecord: vi.fn(async ({ registryItem, recordRemoteId, accountRemoteId, payload }) => ({
        success: true,
        value: {
          tableName: registryItem.tableName,
          recordRemoteId,
          accountRemoteId,
          ownerUserRemoteId: scope.ownerUserRemoteId,
          recordSyncStatus: "synced",
          lastSyncedAt: 1,
          deletedAt: null,
          createdAt: 1,
          updatedAt: 1,
          payload,
        },
      })),
      tombstoneRecord: vi.fn(),
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
          serverCursor: "contacts-cursor",
          changes: [
            {
              tableName: "contacts",
              operation: SyncOperation.Update,
              recordRemoteId: "contact-1",
              payload: {
                remote_id: "contact-1",
                account_remote_id: scope.accountRemoteId,
                full_name: "Hari",
                phone_number: "9800000000",
                opening_balance_amount: 0,
                opening_balance_direction: null,
                is_archived: false,
              },
              serverRevision: "rev-3",
              changedAt: 10,
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(localDatasource.upsertPulledRecord).toHaveBeenCalledWith({
      registryItem: expect.objectContaining({ tableName: "contacts" }),
      recordRemoteId: "contact-1",
      accountRemoteId: scope.accountRemoteId,
      payload: expect.objectContaining({
        server_revision: "rev-3",
      }),
    });
  });

  it("creates a conflict when a local pending version-based record has a stale server_revision", async () => {
    const localDatasource: SyncLocalDatasource = {
      getLocalRecord: vi.fn(async () => ({
        success: true,
        value: {
          tableName: "contacts",
          recordRemoteId: "contact-1",
          accountRemoteId: scope.accountRemoteId,
          ownerUserRemoteId: scope.ownerUserRemoteId,
          recordSyncStatus: "pending_update",
          lastSyncedAt: 1,
          deletedAt: null,
          createdAt: 1,
          updatedAt: 2,
          payload: {
            remote_id: "contact-1",
            account_remote_id: scope.accountRemoteId,
            full_name: "Hari Local",
            phone_number: "9800000000",
            opening_balance_amount: 0,
            opening_balance_direction: null,
            is_archived: false,
            server_revision: "rev-1",
          },
        },
      })),
      markRecordConflict: vi.fn(async () => ({ success: true, value: true })),
      recordSyncConflict: vi.fn(async () => ({
        success: true,
        value: {
          remoteId: "sync-conflict-1",
          tableName: "contacts",
          recordRemoteId: "contact-1",
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
          tableName: "contacts",
          serverCursor: "contacts-cursor",
          changes: [
            {
              tableName: "contacts",
              operation: SyncOperation.Update,
              recordRemoteId: "contact-1",
              payload: {
                remote_id: "contact-1",
                account_remote_id: scope.accountRemoteId,
                full_name: "Hari Remote",
                phone_number: "9800000000",
                opening_balance_amount: 0,
                opening_balance_direction: null,
                is_archived: false,
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
    expect(localDatasource.recordSyncConflict).toHaveBeenCalledTimes(1);
  });

  it("applies newer remote revisions safely when the local record is already synced", async () => {
    const localDatasource: SyncLocalDatasource = {
      getLocalRecord: vi.fn(async () => ({
        success: true,
        value: {
          tableName: "contacts",
          recordRemoteId: "contact-1",
          accountRemoteId: scope.accountRemoteId,
          ownerUserRemoteId: scope.ownerUserRemoteId,
          recordSyncStatus: "synced",
          lastSyncedAt: 1,
          deletedAt: null,
          createdAt: 1,
          updatedAt: 1,
          payload: {
            remote_id: "contact-1",
            account_remote_id: scope.accountRemoteId,
            full_name: "Hari Old",
            phone_number: "9800000000",
            opening_balance_amount: 0,
            opening_balance_direction: null,
            is_archived: false,
            server_revision: "rev-1",
          },
        },
      })),
      upsertPulledRecord: vi.fn(async ({ registryItem, recordRemoteId, accountRemoteId, payload }) => ({
        success: true,
        value: {
          tableName: registryItem.tableName,
          recordRemoteId,
          accountRemoteId,
          ownerUserRemoteId: scope.ownerUserRemoteId,
          recordSyncStatus: "synced",
          lastSyncedAt: 2,
          deletedAt: null,
          createdAt: 1,
          updatedAt: 2,
          payload,
        },
      })),
      tombstoneRecord: vi.fn(),
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
          serverCursor: "contacts-cursor",
          changes: [
            {
              tableName: "contacts",
              operation: SyncOperation.Update,
              recordRemoteId: "contact-1",
              payload: {
                remote_id: "contact-1",
                account_remote_id: scope.accountRemoteId,
                full_name: "Hari New",
                phone_number: "9800000000",
                opening_balance_amount: 0,
                opening_balance_direction: null,
                is_archived: false,
              },
              serverRevision: "rev-2",
              changedAt: 10,
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(localDatasource.upsertPulledRecord).toHaveBeenCalledWith({
      registryItem: expect.objectContaining({ tableName: "contacts" }),
      recordRemoteId: "contact-1",
      accountRemoteId: scope.accountRemoteId,
      payload: expect.objectContaining({
        full_name: "Hari New",
        server_revision: "rev-2",
      }),
    });
    expect(localDatasource.recordSyncConflict).not.toHaveBeenCalled();
  });
});
