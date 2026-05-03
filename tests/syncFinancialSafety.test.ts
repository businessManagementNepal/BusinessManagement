import { createRecalculateMoneyAccountBalancesUseCase } from "@/feature/accounts/useCase/recalculateMoneyAccountBalances.useCase.impl";
import { createSyncRepository } from "@/feature/sync/data/repository/sync.repository.impl";
import type { SyncLocalDatasource } from "@/feature/sync/data/dataSource/syncLocal.datasource";
import type { SyncRemoteDatasource } from "@/feature/sync/data/dataSource/syncRemote.datasource";
import { createApplyPulledChangesUseCase } from "@/feature/sync/useCase/applyPulledChanges.useCase.impl";
import { TransactionDirection } from "@/feature/transactions/types/transaction.entity.types";
import { SyncOperation } from "@/shared/sync/types/syncOperation.types";
import { describe, expect, it, vi } from "vitest";

const scope = {
  deviceId: "device-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "account-1",
  schemaVersion: 45,
};

describe("sync financial safety", () => {
  it("rebuilds money account balances from posted transactions instead of trusting current_balance", async () => {
    const datasource = {
      getActiveMoneyAccountsByScopeAccountRemoteId: vi.fn(async () => ({
        success: true,
        value: [{ remoteId: "cash-1" }, { remoteId: "bank-1" }],
      })),
      getPostedTransactionsByAccountRemoteId: vi.fn(async () => ({
        success: true,
        value: [
          {
            settlementMoneyAccountRemoteId: "cash-1",
            direction: TransactionDirection.In,
            amount: 100,
          },
          {
            settlementMoneyAccountRemoteId: "cash-1",
            direction: TransactionDirection.Out,
            amount: 40,
          },
          {
            settlementMoneyAccountRemoteId: "bank-1",
            direction: TransactionDirection.In,
            amount: 20,
          },
        ],
      })),
      replaceMoneyAccountBalances: vi.fn(async (balances) => ({
        success: true,
        value:
          balances["cash-1"] === 60 && balances["bank-1"] === 20,
      })),
    };

    const useCase = createRecalculateMoneyAccountBalancesUseCase(
      datasource as never,
    );
    const result = await useCase.execute({ accountRemoteId: "account-1" });

    expect(result).toEqual({ success: true, value: true });
    expect(datasource.replaceMoneyAccountBalances).toHaveBeenCalledWith({
      "cash-1": 60,
      "bank-1": 20,
    });
  });

  it("creates a conflict instead of silently overwriting financial fields on pulled transactions", async () => {
    const localDatasource: SyncLocalDatasource = {
      getLocalRecord: vi.fn(async () => ({
        success: true,
        value: {
          tableName: "transactions",
          recordRemoteId: "txn-1",
          accountRemoteId: scope.accountRemoteId,
          ownerUserRemoteId: scope.ownerUserRemoteId,
          recordSyncStatus: "synced",
          lastSyncedAt: 1,
          deletedAt: null,
          createdAt: 1,
          updatedAt: 1,
          payload: {
            remote_id: "txn-1",
            amount: 100,
            direction: "in",
            settlement_money_account_remote_id: "cash-1",
          },
        },
      })),
      markRecordConflict: vi.fn(async () => ({ success: true, value: true })),
      recordSyncConflict: vi.fn(async () => ({
        success: true,
        value: {
          remoteId: "sync-conflict-1",
          tableName: "transactions",
          recordRemoteId: "txn-1",
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
          tableName: "transactions",
          serverCursor: "txn-cursor",
          changes: [
            {
              tableName: "transactions",
              operation: SyncOperation.Update,
              recordRemoteId: "txn-1",
              payload: {
                remote_id: "txn-1",
                amount: 200,
                direction: "inflow",
                settlement_money_account_remote_id: "cash-1",
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
    expect(localDatasource.recordSyncConflict).toHaveBeenCalledTimes(1);
  });
});
