import { createSyncRepository } from "@/feature/sync/data/repository/sync.repository.impl";
import type { SyncLocalDatasource } from "@/feature/sync/data/dataSource/syncLocal.datasource";
import type { SyncRemoteDatasource } from "@/feature/sync/data/dataSource/syncRemote.datasource";
import { createApplyPulledChangesUseCase } from "@/feature/sync/useCase/applyPulledChanges.useCase.impl";
import { SyncOperation } from "@/shared/sync/types/syncOperation.types";
import { describe, expect, it, vi } from "vitest";

const scope = {
  deviceId: "device-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "account-active",
  schemaVersion: 49,
};

const childTableCases = [
  {
    tableName: "billing_document_items",
    recordRemoteId: "bill-item-1",
    payload: {
      remote_id: "bill-item-1",
      document_remote_id: "bill-1",
      line_order: 0,
      item_name: "Rice",
      quantity: 1,
      unit_rate: 100,
      line_total: 100,
    },
  },
  {
    tableName: "order_lines",
    recordRemoteId: "order-line-1",
    payload: {
      remote_id: "order-line-1",
      order_remote_id: "order-1",
      product_remote_id: "product-1",
      quantity: 1,
      line_order: 0,
    },
  },
  {
    tableName: "emi_installments",
    recordRemoteId: "emi-installment-1",
    payload: {
      remote_id: "emi-installment-1",
      plan_remote_id: "plan-1",
      installment_number: 1,
      amount: 500,
      due_at: 1_710_000_000_000,
      status: "due",
    },
  },
  {
    tableName: "account_role_permissions",
    recordRemoteId: "role-1:inventory.view",
    payload: {
      role_remote_id: "role-1",
      permission_code: "inventory.view",
    },
  },
  {
    tableName: "account_user_roles",
    recordRemoteId: "account-active:user-2:role-1",
    payload: {
      account_remote_id: "account-other",
      user_remote_id: "user-2",
      role_remote_id: "role-1",
    },
  },
] as const;

const createLocalDatasourceMock = () => {
  return {
    getLocalRecord: vi.fn(async () => ({ success: true as const, value: null })),
    upsertPulledRecord: vi.fn(async ({ registryItem, recordRemoteId, accountRemoteId, payload }) => ({
      success: true as const,
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
    tombstoneRecord: vi.fn(async () => ({ success: true as const, value: true })),
    markRecordConflict: vi.fn(async () => ({ success: true as const, value: true })),
    recordSyncConflict: vi.fn(async () => ({
      success: true as const,
      value: {
        remoteId: "sync-conflict-1",
        tableName: "contacts",
        recordRemoteId: "record-1",
        accountRemoteId: scope.accountRemoteId,
        localPayloadJson: "{}",
        remotePayloadJson: "{}",
        conflictPolicy: "version_based",
        status: "open",
        createdAt: 1,
        updatedAt: 1,
      },
    })),
  } as unknown as SyncLocalDatasource;
};

describe("sync child record apply scope", () => {
  it.each(childTableCases)(
    "uses scope.accountRemoteId for pulled $tableName upserts",
    async ({ tableName, recordRemoteId, payload }) => {
      const localDatasource = createLocalDatasourceMock();
      const repository = createSyncRepository(
        localDatasource,
        {} as SyncRemoteDatasource,
      );
      const useCase = createApplyPulledChangesUseCase(repository);

      const result = await useCase.execute(scope, {
        tables: [
          {
            tableName,
            serverCursor: `${tableName}-cursor`,
            changes: [
              {
                tableName,
                operation: SyncOperation.Create,
                recordRemoteId,
                payload,
                serverRevision: "rev-1",
                changedAt: 10,
              },
            ],
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(localDatasource.getLocalRecord).toHaveBeenCalledWith(
        expect.objectContaining({ tableName }),
        recordRemoteId,
        scope.accountRemoteId,
      );
      expect(localDatasource.upsertPulledRecord).toHaveBeenCalledWith({
        registryItem: expect.objectContaining({ tableName }),
        recordRemoteId,
        accountRemoteId: scope.accountRemoteId,
        payload: expect.not.objectContaining({
          business_account_remote_id: expect.anything(),
          scope_account_remote_id: expect.anything(),
        }),
      });
    },
  );

  it.each(childTableCases)(
    "uses scope.accountRemoteId for pulled $tableName tombstones",
    async ({ tableName, recordRemoteId, payload }) => {
      const localDatasource = createLocalDatasourceMock();
      const repository = createSyncRepository(
        localDatasource,
        {} as SyncRemoteDatasource,
      );
      const useCase = createApplyPulledChangesUseCase(repository);

      const result = await useCase.execute(scope, {
        tables: [
          {
            tableName,
            serverCursor: `${tableName}-cursor`,
            changes: [
              {
                tableName,
                operation: SyncOperation.Delete,
                recordRemoteId,
                payload: {
                  ...payload,
                  deleted_at: 99,
                },
                serverRevision: "rev-2",
                changedAt: 99,
              },
            ],
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(localDatasource.tombstoneRecord).toHaveBeenCalledWith({
        registryItem: expect.objectContaining({ tableName }),
        recordRemoteId,
        accountRemoteId: scope.accountRemoteId,
        deletedAt: 99,
      });
    },
  );
});
