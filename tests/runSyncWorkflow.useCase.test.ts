import { createRunSyncWorkflowUseCase } from "@/feature/sync/workflow/syncRun/useCase/runSyncWorkflow.useCase.impl";
import { createSyncLock } from "@/shared/sync/runtime/syncLock";
import { describe, expect, it, vi } from "vitest";

const input = {
  deviceId: "device-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "account-1",
  schemaVersion: 49,
  activeUserRemoteId: "user-1",
  activeAccountRemoteId: "account-1",
};

describe("runSyncWorkflow use case", () => {
  it("runs push, pull, apply, rebuild, checkpoint save, and completion in order", async () => {
    const syncRunRepository = {
      createRun: vi.fn(async () => ({
        success: true,
        value: {
          remoteId: "sync-run-1",
        },
      })),
      pushPendingChanges: vi.fn(async () => ({
        success: true,
        value: { pushedCount: 2, conflictCount: 1, failedCount: 0 },
      })),
      pullRemoteChanges: vi.fn(async () => ({
        success: true,
        value: {
          tables: [
            { tableName: "contacts", serverCursor: "cursor-1", changes: [{}, {}] },
          ],
        },
      })),
      applyPulledChanges: vi.fn(async () => ({
        success: true,
        value: {
          appliedCount: 2,
          conflictCount: 1,
          failedCount: 0,
          touchedMoneyAccountProjection: true,
          touchedInventoryProjection: false,
          checkpointUpdates: [
            { tableName: "contacts", serverCursor: "cursor-1" },
          ],
        },
      })),
      rebuildProjections: vi.fn(async () => ({ success: true, value: true })),
      saveCheckpoints: vi.fn(async () => ({ success: true, value: true })),
      completeRun: vi.fn(async () => ({
        success: true,
        value: { remoteId: "sync-run-1" },
      })),
      failRun: vi.fn(),
      recordAuditEvent: vi.fn(async () => ({ success: true, value: true })),
    };

    const useCase = createRunSyncWorkflowUseCase({
      syncRunRepository: syncRunRepository as never,
      syncLock: createSyncLock(),
      getSyncFeatureFlagUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: { syncEnabled: true },
        })),
      } as never,
    });

    const result = await useCase.execute(input);

    expect(result.success).toBe(true);
    expect(syncRunRepository.rebuildProjections).toHaveBeenCalledTimes(1);
    expect(syncRunRepository.saveCheckpoints).toHaveBeenCalledTimes(1);
    expect(syncRunRepository.completeRun).toHaveBeenCalledTimes(1);

    const applyOrder = syncRunRepository.applyPulledChanges.mock.invocationCallOrder[0];
    const rebuildOrder =
      syncRunRepository.rebuildProjections.mock.invocationCallOrder[0];
    const checkpointOrder =
      syncRunRepository.saveCheckpoints.mock.invocationCallOrder[0];

    expect(applyOrder).toBeLessThan(rebuildOrder);
    expect(rebuildOrder).toBeLessThan(checkpointOrder);
  });

  it("prevents overlapping sync runs with the shared lock", async () => {
    const lock = createSyncLock();
    const firstAcquire = lock.acquire();
    expect(firstAcquire.acquired).toBe(true);

    const useCase = createRunSyncWorkflowUseCase({
      syncRunRepository: {} as never,
      syncLock: lock,
      getSyncFeatureFlagUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: { syncEnabled: true },
        })),
      } as never,
    });

    const result = await useCase.execute(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Sync already running");
    }

    if (firstAcquire.acquired) {
      firstAcquire.release();
    }
  });
});
