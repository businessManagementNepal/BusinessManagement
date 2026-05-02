import { createRecalculateStockProjectionUseCase } from "@/feature/inventory/useCase/recalculateStockProjection.useCase.impl";
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

describe("sync inventory projection safety", () => {
  it("rebuilds stock from movement deltas instead of trusting cached product stock", async () => {
    const datasource = {
      getActiveStockProductsByAccountRemoteId: vi.fn(async () => ({
        success: true,
        value: [{ remoteId: "product-1" }, { remoteId: "product-2" }],
      })),
      getInventoryMovementsByAccountRemoteId: vi.fn(async () => ({
        success: true,
        value: [
          { productRemoteId: "product-1", deltaQuantity: 10 },
          { productRemoteId: "product-1", deltaQuantity: -3 },
          { productRemoteId: "product-2", deltaQuantity: 5 },
        ],
      })),
      replaceStockQuantities: vi.fn(async (stockByProductRemoteId) => ({
        success: true,
        value:
          stockByProductRemoteId["product-1"] === 7 &&
          stockByProductRemoteId["product-2"] === 5,
      })),
    };

    const useCase = createRecalculateStockProjectionUseCase(datasource as never);
    const result = await useCase.execute({ accountRemoteId: "account-1" });

    expect(result).toEqual({ success: true, value: true });
    expect(datasource.replaceStockQuantities).toHaveBeenCalledWith({
      "product-1": 7,
      "product-2": 5,
    });
  });

  it("flags inventory projection rebuilds after pulled inventory movements", async () => {
    const localDatasource: SyncLocalDatasource = {
      getLocalRecord: vi.fn(async () => ({ success: true, value: null })),
      upsertPulledRecord: vi.fn(async (_registryItem, recordRemoteId, payload) => ({
        success: true,
        value: {
          tableName: "inventory_movements",
          recordRemoteId,
          accountRemoteId: scope.accountRemoteId,
          ownerUserRemoteId: scope.ownerUserRemoteId,
          recordSyncStatus: "synced",
          lastSyncedAt: 1,
          deletedAt: null,
          createdAt: 1,
          updatedAt: 1,
          payload,
        },
      })),
      markRecordConflict: vi.fn(),
      recordSyncConflict: vi.fn(),
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
          tableName: "inventory_movements",
          serverCursor: "inventory-cursor",
          changes: [
            {
              tableName: "inventory_movements",
              operation: SyncOperation.Create,
              recordRemoteId: "movement-1",
              payload: {
                remote_id: "movement-1",
                product_remote_id: "product-1",
                delta_quantity: 2,
              },
              serverRevision: "rev-1",
              changedAt: 20,
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.touchedInventoryProjection).toBe(true);
  });
});
