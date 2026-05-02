import { createSyncRepository } from "@/feature/sync/data/repository/sync.repository.impl";
import type { SyncLocalDatasource } from "@/feature/sync/data/dataSource/syncLocal.datasource";
import type { SyncRemoteDatasource } from "@/feature/sync/data/dataSource/syncRemote.datasource";
import { createPullRemoteChangesUseCase } from "@/feature/sync/useCase/pullRemoteChanges.useCase.impl";
import { describe, expect, it, vi } from "vitest";

const scope = {
  deviceId: "device-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "account-1",
  schemaVersion: 45,
};

describe("pullRemoteChanges use case", () => {
  it("loads cursors first and then pulls remote changes", async () => {
    const localDatasource: SyncLocalDatasource = {
      getCheckpoint: vi.fn(async (_scope, tableName) => ({
        success: true,
        value:
          tableName === "contacts"
            ? {
                remoteId: "checkpoint-1",
                ownerUserRemoteId: scope.ownerUserRemoteId,
                accountRemoteId: scope.accountRemoteId,
                tableName,
                serverCursor: "contacts-cursor",
                lastPulledAt: 100,
                createdAt: 100,
                updatedAt: 100,
              }
            : null,
      })),
    } as unknown as SyncLocalDatasource;
    const remoteDatasource: SyncRemoteDatasource = {
      pushChanges: vi.fn(),
      pullChanges: vi.fn(async (request) => ({
        tables: [
          {
            tableName: "contacts",
            serverCursor:
              request.cursors.find(
                (cursor: { tableName: string; serverCursor: string | null }) =>
                  cursor.tableName === "contacts",
              )?.serverCursor ?? null,
            changes: [],
          },
        ],
      })),
    };

    const repository = createSyncRepository(localDatasource, remoteDatasource);
    const useCase = createPullRemoteChangesUseCase(repository);

    const result = await useCase.execute(scope);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.value.tables[0]?.serverCursor).toBe("contacts-cursor");
    expect(remoteDatasource.pullChanges).toHaveBeenCalledTimes(1);
  });
});
