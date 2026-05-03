// @vitest-environment jsdom

import { useSyncStatusViewModel } from "@/feature/sync/viewModel/syncStatus.viewModel.impl";
import { SYNC_BACKEND_AUTH_REQUIRED_MESSAGE } from "@/shared/sync/constants/sync.constants";
import React, { act, useEffect } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const buildAccount = (overrides: Record<string, unknown> = {}) => ({
  remoteId: "account-1",
  ownerUserRemoteId: "owner-1",
  ...overrides,
});

const buildSyncStatus = (overrides: Record<string, unknown> = {}) => ({
  pendingChangesCount: 3,
  conflictCount: 1,
  failedRecordsCount: 0,
  lastSyncedAt: null,
  isRunning: false,
  ...overrides,
});

type HarnessProps = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  runtimeError: Error | null;
  getSyncFeatureFlagUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  updateSyncFeatureFlagUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  getSyncStatusUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  runManualSyncUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  getAccountByRemoteIdUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };
  getDeviceId: () => Promise<string>;
  getAccessToken: () => Promise<string | null>;
  schemaVersion: number;
  onUpdate: (value: ReturnType<typeof useSyncStatusViewModel>) => void;
};

function SyncStatusViewModelHarness(props: HarnessProps) {
  const viewModel = useSyncStatusViewModel({
    activeUserRemoteId: props.activeUserRemoteId,
    activeAccountRemoteId: props.activeAccountRemoteId,
    runtimeError: props.runtimeError,
    getSyncFeatureFlagUseCase: props.getSyncFeatureFlagUseCase as never,
    updateSyncFeatureFlagUseCase: props.updateSyncFeatureFlagUseCase as never,
    getSyncStatusUseCase: props.getSyncStatusUseCase as never,
    runManualSyncUseCase: props.runManualSyncUseCase as never,
    getAccountByRemoteIdUseCase: props.getAccountByRemoteIdUseCase as never,
    getDeviceId: props.getDeviceId,
    getAccessToken: props.getAccessToken,
    schemaVersion: props.schemaVersion,
  });

  useEffect(() => {
    props.onUpdate(viewModel);
  }, [props, viewModel]);

  return null;
}

const flushEffects = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("syncStatus.viewModel", () => {
  let container: HTMLDivElement;
  let root: Root;
  let latestViewModel: ReturnType<typeof useSyncStatusViewModel> | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    latestViewModel = null;
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  const renderHarness = async (overrides: Partial<HarnessProps> = {}) => {
    const props: HarnessProps = {
      activeUserRemoteId: "owner-1",
      activeAccountRemoteId: "account-1",
      runtimeError: null,
      getSyncFeatureFlagUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: { syncEnabled: true },
        })),
      },
      updateSyncFeatureFlagUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: { syncEnabled: true },
        })),
      },
      getSyncStatusUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: buildSyncStatus(),
        })),
      },
      runManualSyncUseCase: {
        execute: vi.fn(),
      },
      getAccountByRemoteIdUseCase: {
        execute: vi.fn(async () => ({
          success: true as const,
          value: buildAccount(),
        })),
      },
      getDeviceId: vi.fn(async () => "device-1"),
      getAccessToken: vi.fn(async () => "token-1"),
      schemaVersion: 50,
      onUpdate: (value) => {
        latestViewModel = value;
      },
      ...overrides,
    };

    await act(async () => {
      root.render(<SyncStatusViewModelHarness {...props} />);
      await flushEffects();
    });

    return props;
  };

  it("shows a backend sign-in notice and disables manual sync when no token exists", async () => {
    const props = await renderHarness({
      getAccessToken: vi.fn(async () => null),
    });

    expect(latestViewModel?.statusLabel).toBe("Backend sign-in required");
    expect(latestViewModel?.noticeMessage).toBe(
      SYNC_BACKEND_AUTH_REQUIRED_MESSAGE,
    );
    expect(latestViewModel?.errorMessage).toBe(null);
    expect(latestViewModel?.canRunManualSync).toBe(false);
    expect(props.getSyncStatusUseCase.execute).toHaveBeenCalledWith({
      deviceId: "device-1",
      ownerUserRemoteId: "owner-1",
      accountRemoteId: "account-1",
      schemaVersion: 50,
    });
  });

  it("enables manual sync when sync context and backend auth are ready", async () => {
    await renderHarness();

    expect(latestViewModel?.statusLabel).toBe("Ready for manual sync");
    expect(latestViewModel?.noticeMessage).toBe(null);
    expect(latestViewModel?.errorMessage).toBe(null);
    expect(latestViewModel?.pendingCount).toBe(3);
    expect(latestViewModel?.conflictCount).toBe(1);
    expect(latestViewModel?.canRunManualSync).toBe(true);
  });
});
