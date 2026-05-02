import { createSyncRepository } from "@/feature/sync/data/repository/sync.repository.impl";
import type { SyncLocalDatasource } from "@/feature/sync/data/dataSource/syncLocal.datasource";
import type { SyncRemoteDatasource } from "@/feature/sync/data/dataSource/syncRemote.datasource";
import { describe, expect, it, vi } from "vitest";

const scope = {
  deviceId: "device-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "account-1",
  schemaVersion: 45,
};

const createLocalDatasourceMock = (): SyncLocalDatasource =>
  ({
    getCheckpoint: vi.fn(async (_scope, tableName: string) => ({
      success: true,
      value:
        tableName === "contacts"
          ? {
              remoteId: "checkpoint-1",
              ownerUserRemoteId: scope.ownerUserRemoteId,
              accountRemoteId: scope.accountRemoteId,
              tableName,
              serverCursor: "cursor-contacts",
              lastPulledAt: 100,
              createdAt: 100,
              updatedAt: 100,
            }
          : null,
    })),
    saveCheckpoint: vi.fn(async (input) => ({
      success: true,
      value: {
        remoteId: `checkpoint-${input.tableName}`,
        ownerUserRemoteId: input.ownerUserRemoteId,
        accountRemoteId: input.accountRemoteId,
        tableName: input.tableName,
        serverCursor: input.serverCursor,
        lastPulledAt: input.lastPulledAt,
        createdAt: 1,
        updatedAt: 1,
      },
    })),
  } as unknown as SyncLocalDatasource);

describe("sync checkpoint repository", () => {
  it("builds pull cursors from local checkpoints", async () => {
    const localDatasource = createLocalDatasourceMock();
    const remoteDatasource = {} as SyncRemoteDatasource;
    const repository = createSyncRepository(localDatasource, remoteDatasource);

    const result = await repository.getPullRequest(scope);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const contactsCursor = result.value.cursors.find(
      (cursor) => cursor.tableName === "contacts",
    );

    expect(contactsCursor?.serverCursor).toBe("cursor-contacts");
    expect(localDatasource.getCheckpoint).toHaveBeenCalled();
  });

  it("persists checkpoint updates after a successful workflow apply", async () => {
    const localDatasource = createLocalDatasourceMock();
    const remoteDatasource = {} as SyncRemoteDatasource;
    const repository = createSyncRepository(localDatasource, remoteDatasource);

    const result = await repository.saveCheckpoints(
      scope,
      [
        { tableName: "contacts", serverCursor: "cursor-2" },
        { tableName: "products", serverCursor: "cursor-3" },
      ],
      300,
    );

    expect(result).toEqual({ success: true, value: true });
    expect(localDatasource.saveCheckpoint).toHaveBeenCalledTimes(2);
  });
});
