import { createRecalculateMoneyAccountBalancesUseCase } from "@/feature/accounts/useCase/recalculateMoneyAccountBalances.useCase.impl";
import { createSyncRepository } from "@/feature/sync/data/repository/sync.repository.impl";
import type { SyncLocalDatasource } from "@/feature/sync/data/dataSource/syncLocal.datasource";
import type { SyncRemoteDatasource } from "@/feature/sync/data/dataSource/syncRemote.datasource";
import { createApplyPulledChangesUseCase } from "@/feature/sync/useCase/applyPulledChanges.useCase.impl";
import { migrations } from "@/shared/database/migration";
import { SyncOperation } from "@/shared/sync/types/syncOperation.types";
import { TransactionDirection } from "@/feature/transactions/types/transaction.entity.types";
import { describe, expect, it, vi } from "vitest";

const scope = {
  deviceId: "device-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "account-1",
  schemaVersion: 49,
};

type MigrationStep = {
  type?: string;
  sql?: string;
};

type MigrationDefinition = {
  toVersion: number;
  steps: readonly MigrationStep[];
};

const getMigrationDefinitions = (): readonly MigrationDefinition[] => {
  const value = migrations as unknown as {
    sortedMigrations?: readonly MigrationDefinition[];
    migrations?: readonly MigrationDefinition[];
  };

  return value.sortedMigrations ?? value.migrations ?? [];
};

describe("sync money account opening balance projection", () => {
  it("keeps opening balance when there are no posted transactions", async () => {
    const datasource = {
      getActiveMoneyAccountsByScopeAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "cash-1",
            openingBalanceAmount: 10_000,
            openingBalanceDirection: "in",
          },
        ],
      })),
      getPostedTransactionsByAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [],
      })),
      replaceMoneyAccountBalances: vi.fn(async (balances) => ({
        success: true as const,
        value: balances["cash-1"] === 10_000,
      })),
    };

    const useCase = createRecalculateMoneyAccountBalancesUseCase(
      datasource as never,
    );
    const result = await useCase.execute({ accountRemoteId: scope.accountRemoteId });

    expect(result).toEqual({ success: true, value: true });
    expect(datasource.replaceMoneyAccountBalances).toHaveBeenCalledWith({
      "cash-1": 10_000,
    });
  });

  it("adds income on top of the opening balance", async () => {
    const datasource = {
      getActiveMoneyAccountsByScopeAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "cash-1",
            openingBalanceAmount: 10_000,
            openingBalanceDirection: "in",
          },
        ],
      })),
      getPostedTransactionsByAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            settlementMoneyAccountRemoteId: "cash-1",
            direction: TransactionDirection.In,
            amount: 500,
          },
        ],
      })),
      replaceMoneyAccountBalances: vi.fn(async (balances) => ({
        success: true as const,
        value: balances["cash-1"] === 10_500,
      })),
    };

    const useCase = createRecalculateMoneyAccountBalancesUseCase(
      datasource as never,
    );
    const result = await useCase.execute({ accountRemoteId: scope.accountRemoteId });

    expect(result).toEqual({ success: true, value: true });
    expect(datasource.replaceMoneyAccountBalances).toHaveBeenCalledWith({
      "cash-1": 10_500,
    });
  });

  it("subtracts expenses from the opening balance", async () => {
    const datasource = {
      getActiveMoneyAccountsByScopeAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "cash-1",
            openingBalanceAmount: 10_000,
            openingBalanceDirection: "in",
          },
        ],
      })),
      getPostedTransactionsByAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            settlementMoneyAccountRemoteId: "cash-1",
            direction: TransactionDirection.Out,
            amount: 300,
          },
        ],
      })),
      replaceMoneyAccountBalances: vi.fn(async (balances) => ({
        success: true as const,
        value: balances["cash-1"] === 9_700,
      })),
    };

    const useCase = createRecalculateMoneyAccountBalancesUseCase(
      datasource as never,
    );
    const result = await useCase.execute({ accountRemoteId: scope.accountRemoteId });

    expect(result).toEqual({ success: true, value: true });
    expect(datasource.replaceMoneyAccountBalances).toHaveBeenCalledWith({
      "cash-1": 9_700,
    });
  });

  it("supports outbound opening balances", async () => {
    const datasource = {
      getActiveMoneyAccountsByScopeAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "cash-1",
            openingBalanceAmount: 1_000,
            openingBalanceDirection: "out",
          },
        ],
      })),
      getPostedTransactionsByAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            settlementMoneyAccountRemoteId: "cash-1",
            direction: TransactionDirection.In,
            amount: 200,
          },
        ],
      })),
      replaceMoneyAccountBalances: vi.fn(async (balances) => ({
        success: true as const,
        value: balances["cash-1"] === -800,
      })),
    };

    const useCase = createRecalculateMoneyAccountBalancesUseCase(
      datasource as never,
    );
    const result = await useCase.execute({ accountRemoteId: scope.accountRemoteId });

    expect(result).toEqual({ success: true, value: true });
    expect(datasource.replaceMoneyAccountBalances).toHaveBeenCalledWith({
      "cash-1": -800,
    });
  });

  it("keeps remote current_balance ignored while allowing opening balance fields through pull apply", async () => {
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
          tableName: "money_accounts",
          serverCursor: "money-accounts-cursor",
          changes: [
            {
              tableName: "money_accounts",
              operation: SyncOperation.Update,
              recordRemoteId: "cash-1",
              payload: {
                remote_id: "cash-1",
                scope_account_remote_id: scope.accountRemoteId,
                current_balance: 999_999,
                opening_balance_amount: 10_000,
                opening_balance_direction: "in",
              },
              serverRevision: "rev-1",
              changedAt: 10,
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(localDatasource.upsertPulledRecord).toHaveBeenCalledWith({
      registryItem: expect.objectContaining({ tableName: "money_accounts" }),
      recordRemoteId: "cash-1",
      accountRemoteId: scope.accountRemoteId,
      payload: {
        remote_id: "cash-1",
        scope_account_remote_id: scope.accountRemoteId,
        opening_balance_amount: 10_000,
        opening_balance_direction: "in",
        server_revision: "rev-1",
      },
    });
  });

  it("contains the migration 47 backfill from current_balance into opening balance fields", () => {
    const migration47 = getMigrationDefinitions().find(
      (definition) => definition.toVersion === 47,
    );

    expect(migration47).toBeDefined();
    const stepStrings = (migration47?.steps ?? []).map((step) =>
      JSON.stringify(step),
    );

    expect(stepStrings.join("\n")).toContain("opening_balance_amount = current_balance");
    expect(stepStrings.join("\n")).toContain("WHEN current_balance < 0 THEN 'out'");
  });
});
