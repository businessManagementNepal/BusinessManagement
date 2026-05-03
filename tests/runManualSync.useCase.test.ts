import { createRunManualSyncUseCase } from "@/feature/sync/useCase/runManualSync.useCase.impl";
import { SYNC_BACKEND_AUTH_REQUIRED_MESSAGE } from "@/shared/sync/constants/sync.constants";
import { describe, expect, it, vi } from "vitest";

describe("runManualSync use case", () => {
  it("blocks manual sync when the active account is missing", async () => {
    const useCase = createRunManualSyncUseCase({
      ensureDatabaseReady: vi.fn(async () => undefined),
      getAccountByRemoteIdUseCase: {
        execute: vi.fn(),
      } as never,
      getAccessToken: vi.fn(async () => "token-1"),
      getDeviceId: vi.fn(async () => "device-1"),
      runSyncWorkflowUseCase: {
        execute: vi.fn(),
      } as never,
      schemaVersion: 50,
    });

    const result = await useCase.execute({
      activeUserRemoteId: "user-1",
      activeAccountRemoteId: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Sync requires an active account.");
    }
  });

  it("blocks manual sync when no access token exists", async () => {
    const runSyncWorkflowUseCase = {
      execute: vi.fn(),
    };
    const useCase = createRunManualSyncUseCase({
      ensureDatabaseReady: vi.fn(async () => undefined),
      getAccountByRemoteIdUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            remoteId: "account-1",
            ownerUserRemoteId: "owner-1",
          },
        })),
      } as never,
      getAccessToken: vi.fn(async () => null),
      getDeviceId: vi.fn(async () => "device-1"),
      runSyncWorkflowUseCase: runSyncWorkflowUseCase as never,
      schemaVersion: 50,
    });

    const result = await useCase.execute({
      activeUserRemoteId: "user-1",
      activeAccountRemoteId: "account-1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe(SYNC_BACKEND_AUTH_REQUIRED_MESSAGE);
    }
    expect(runSyncWorkflowUseCase.execute).not.toHaveBeenCalled();
  });

  it("delegates to the sync workflow once the database, account, token, and device are ready", async () => {
    const runSyncWorkflowUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          syncRunRemoteId: "sync-run-1",
          pushedCount: 1,
          pulledCount: 2,
          conflictCount: 0,
          failedCount: 0,
          applySummary: {
            appliedCount: 2,
            conflictCount: 0,
            failedCount: 0,
            touchedMoneyAccountProjection: false,
            touchedInventoryProjection: false,
            checkpointUpdates: [],
          },
        },
      })),
    };
    const useCase = createRunManualSyncUseCase({
      ensureDatabaseReady: vi.fn(async () => undefined),
      getAccountByRemoteIdUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: {
            remoteId: "account-1",
            ownerUserRemoteId: "owner-1",
          },
        })),
      } as never,
      getAccessToken: vi.fn(async () => "token-1"),
      getDeviceId: vi.fn(async () => "device-1"),
      runSyncWorkflowUseCase: runSyncWorkflowUseCase as never,
      schemaVersion: 50,
    });

    const result = await useCase.execute({
      activeUserRemoteId: "user-1",
      activeAccountRemoteId: "account-1",
    });

    expect(result.success).toBe(true);
    expect(runSyncWorkflowUseCase.execute).toHaveBeenCalledWith({
      deviceId: "device-1",
      ownerUserRemoteId: "owner-1",
      accountRemoteId: "account-1",
      schemaVersion: 50,
      activeUserRemoteId: "user-1",
      activeAccountRemoteId: "account-1",
    });
  });
});
