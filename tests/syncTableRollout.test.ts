import { createPullRemoteChangesUseCase } from "@/feature/sync/useCase/pullRemoteChanges.useCase.impl";
import { createPushPendingChangesUseCase } from "@/feature/sync/useCase/pushPendingChanges.useCase.impl";
import { describe, expect, it, vi } from "vitest";

const scope = {
  deviceId: "device-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "account-1",
  schemaVersion: 50,
  syncRunRemoteId: "sync-run-1",
};

describe("sync table rollout", () => {
  it("only pushes allowed rollout tables", async () => {
    const repository = {
      getPendingChangeSet: vi.fn(async (_scope, tableName: string) => ({
        success: true as const,
        value:
          tableName === "contacts"
            ? [
                {
                  tableName,
                  operation: "create",
                  recordRemoteId: "contact-1",
                  payload: { remote_id: "contact-1" },
                  serverRevision: null,
                  changedAt: 1,
                },
              ]
            : [],
      })),
      pushChanges: vi.fn(async () => ({
        success: true as const,
        value: {
          acknowledgements: [
            {
              tableName: "contacts",
              recordRemoteId: "contact-1",
              status: "accepted" as const,
              serverRevision: "rev-1",
            },
          ],
        },
      })),
      applyPushAcknowledgements: vi.fn(async () => ({
        success: true as const,
        value: {
          pushedCount: 1,
          conflictCount: 0,
          failedCount: 0,
        },
      })),
    };

    const useCase = createPushPendingChangesUseCase(repository as never);
    await useCase.execute(scope);

    const requestedTables = repository.getPendingChangeSet.mock.calls.map(
      (call) => call[1],
    );
    expect(requestedTables).toEqual(["categories", "contacts", "products"]);
    expect(requestedTables).not.toContain("transactions");
    expect(repository.pushChanges).toHaveBeenCalledTimes(1);
  });

  it("only requests and returns allowed rollout pull tables", async () => {
    const repository = {
      getPullRequest: vi.fn(async () => ({
        success: true as const,
        value: {
          ...scope,
          cursors: [
            { tableName: "contacts", serverCursor: "cursor-1" },
            { tableName: "transactions", serverCursor: "cursor-2" },
            { tableName: "products", serverCursor: "cursor-3" },
          ],
        },
      })),
      pullChanges: vi.fn(async (request) => ({
        success: true as const,
        value: {
          tables: [
            {
              tableName: "contacts",
              serverCursor:
                request.cursors.find(
                  (cursor: { tableName: string }) => cursor.tableName === "contacts",
                )?.serverCursor ?? null,
              changes: [],
            },
            {
              tableName: "transactions",
              serverCursor: "cursor-2",
              changes: [],
            },
            {
              tableName: "products",
              serverCursor:
                request.cursors.find(
                  (cursor: { tableName: string }) => cursor.tableName === "products",
                )?.serverCursor ?? null,
              changes: [],
            },
          ],
        },
      })),
    };

    const useCase = createPullRemoteChangesUseCase(repository as never);
    const result = await useCase.execute(scope);

    expect(result.success).toBe(true);
    expect(repository.pullChanges).toHaveBeenCalledWith({
      ...scope,
      cursors: [
        { tableName: "contacts", serverCursor: "cursor-1" },
        { tableName: "products", serverCursor: "cursor-3" },
      ],
    });
    if (!result.success) {
      return;
    }

    expect(result.value.tables.map((table) => table.tableName)).toEqual([
      "contacts",
      "products",
    ]);
  });
});
