import { describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { __DEV__?: boolean }
).__DEV__ = false;

vi.mock("react-native", () => ({
  Platform: {
    OS: "web",
    select: <T,>(values: { web?: T; default?: T }) =>
      values.web ?? values.default,
  },
  TurboModuleRegistry: {
    getEnforcing: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => undefined),
  deleteItemAsync: vi.fn(async () => undefined),
}));

import { createLocalSyncFeatureFlagDatasource } from "@/feature/sync/data/dataSource/local.syncFeatureFlag.datasource.impl";
import { createRunSyncWorkflowUseCase } from "@/feature/sync/workflow/syncRun/useCase/runSyncWorkflow.useCase.impl";
import { createSyncLock } from "@/shared/sync/runtime/syncLock";
import type { Database, Model } from "@nozbe/watermelondb";

const input = {
  deviceId: "device-1",
  ownerUserRemoteId: "user-1",
  accountRemoteId: "account-1",
  schemaVersion: 49,
  activeUserRemoteId: "user-1",
  activeAccountRemoteId: "account-1",
};

const createDatabaseMock = (records: readonly any[]) =>
  ({
    get: vi.fn(() => ({
      query: vi.fn(() => ({
        fetch: vi.fn(async () => records as unknown as Model[]),
      })),
    })),
  }) as unknown as Database;

describe("sync feature flag", () => {
  it("defaults sync_enabled to false when app settings are missing", async () => {
    const datasource = createLocalSyncFeatureFlagDatasource(createDatabaseMock([]));
    const result = await datasource.getSyncEnabled();

    expect(result).toEqual({ success: true, value: false });
  });

  it("does not silently enable sync when the stored setting is null", async () => {
    const datasource = createLocalSyncFeatureFlagDatasource(
      createDatabaseMock([
        {
          id: "singleton",
          syncEnabled: null,
          updatedAt: new Date(1),
        },
      ]),
    );
    const result = await datasource.getSyncEnabled();

    expect(result).toEqual({ success: true, value: false });
  });

  it("does not run the sync workflow when sync_enabled is false", async () => {
    const syncRunRepository = {
      createRun: vi.fn(),
    };
    const getSyncFeatureFlagUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: { syncEnabled: false },
      })),
    };

    const useCase = createRunSyncWorkflowUseCase({
      syncRunRepository: syncRunRepository as never,
      syncLock: createSyncLock(),
      getSyncFeatureFlagUseCase: getSyncFeatureFlagUseCase as never,
    });

    const result = await useCase.execute(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Sync is disabled for this context.");
    }
    expect(syncRunRepository.createRun).not.toHaveBeenCalled();
  });

  it("runs the sync workflow when sync_enabled is true and context is valid", async () => {
    const syncRunRepository = {
      createRun: vi.fn(async () => ({
        success: true as const,
        value: { remoteId: "sync-run-1" },
      })),
      pushPendingChanges: vi.fn(async () => ({
        success: true as const,
        value: { pushedCount: 1, conflictCount: 0, failedCount: 0 },
      })),
      pullRemoteChanges: vi.fn(async () => ({
        success: true as const,
        value: { tables: [] },
      })),
      applyPulledChanges: vi.fn(async () => ({
        success: true as const,
        value: {
          appliedCount: 0,
          conflictCount: 0,
          failedCount: 0,
          touchedMoneyAccountProjection: false,
          touchedInventoryProjection: false,
          checkpointUpdates: [],
        },
      })),
      rebuildProjections: vi.fn(async () => ({ success: true as const, value: true })),
      saveCheckpoints: vi.fn(async () => ({ success: true as const, value: true })),
      completeRun: vi.fn(async () => ({
        success: true as const,
        value: { remoteId: "sync-run-1" },
      })),
      failRun: vi.fn(),
      recordAuditEvent: vi.fn(async () => ({ success: true as const, value: true })),
    };
    const getSyncFeatureFlagUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: { syncEnabled: true },
      })),
    };

    const useCase = createRunSyncWorkflowUseCase({
      syncRunRepository: syncRunRepository as never,
      syncLock: createSyncLock(),
      getSyncFeatureFlagUseCase: getSyncFeatureFlagUseCase as never,
    });

    const result = await useCase.execute(input);

    expect(result.success).toBe(true);
    expect(syncRunRepository.createRun).toHaveBeenCalledTimes(1);
  });
});
