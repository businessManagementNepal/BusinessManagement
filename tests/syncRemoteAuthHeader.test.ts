import { createMemorySyncAuthHeaderAdapter } from "@/feature/sync/data/adapter/memory.syncAuthHeader.adapter.impl";
import { createSecureSyncAuthHeaderAdapter } from "@/feature/sync/data/adapter/secure.syncAuthHeader.adapter.impl";
import { createRemoteSyncRemoteDatasource } from "@/feature/sync/data/dataSource/remote.syncRemote.datasource.impl";
import {
  SYNC_PULL_ENDPOINT,
  SYNC_PUSH_ENDPOINT,
} from "@/shared/sync/constants/sync.constants";
import { describe, expect, it, vi } from "vitest";

const baseUrl = "https://sync.example.com";

const createFetchResponse = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
  }) as Response;

describe("sync remote auth header", () => {
  it("includes auth headers in push requests", async () => {
    const fetchFn = vi.fn(async () =>
      createFetchResponse({ acknowledgements: [] }),
    );
    const datasource = createRemoteSyncRemoteDatasource({
      apiBaseUrl: baseUrl,
      authHeaderAdapter: createMemorySyncAuthHeaderAdapter({
        Authorization: "Bearer token-123",
      }),
      fetchFn,
    });

    await datasource.pushChanges({
      deviceId: "device-1",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "account-1",
      schemaVersion: 49,
      syncRunRemoteId: "sync-run-1",
      changes: [],
    });

    expect(fetchFn).toHaveBeenCalledWith(
      `${baseUrl}${SYNC_PUSH_ENDPOINT}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer token-123",
        }),
      }),
    );
  });

  it("includes auth headers in pull requests", async () => {
    const fetchFn = vi.fn(async () => createFetchResponse({ tables: [] }));
    const datasource = createRemoteSyncRemoteDatasource({
      apiBaseUrl: baseUrl,
      authHeaderAdapter: createMemorySyncAuthHeaderAdapter({
        Authorization: "Bearer token-456",
      }),
      fetchFn,
    });

    await datasource.pullChanges({
      deviceId: "device-1",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "account-1",
      schemaVersion: 49,
      cursors: [],
    });

    expect(fetchFn).toHaveBeenCalledWith(
      `${baseUrl}${SYNC_PULL_ENDPOINT}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer token-456",
        }),
      }),
    );
  });

  it("does not log token values while building auth headers", async () => {
    const fetchFn = vi.fn(async () =>
      createFetchResponse({ acknowledgements: [] }),
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const datasource = createRemoteSyncRemoteDatasource({
      apiBaseUrl: baseUrl,
      authHeaderAdapter: createMemorySyncAuthHeaderAdapter({
        Authorization: "Bearer token-secret",
      }),
      fetchFn,
    });

    await datasource.pushChanges({
      deviceId: "device-1",
      ownerUserRemoteId: "user-1",
      accountRemoteId: "account-1",
      schemaVersion: 49,
      syncRunRemoteId: "sync-run-1",
      changes: [],
    });

    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("token-secret"),
    );
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("token-secret"),
    );

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("returns a safe error when the secure adapter requires auth but no token exists", async () => {
    const fetchFn = vi.fn();
    const datasource = createRemoteSyncRemoteDatasource({
      apiBaseUrl: baseUrl,
      authHeaderAdapter: createSecureSyncAuthHeaderAdapter({
        getAccessToken: async () => null,
        requireAuth: true,
      }),
      fetchFn,
    });

    await expect(
      datasource.pushChanges({
        deviceId: "device-1",
        ownerUserRemoteId: "user-1",
        accountRemoteId: "account-1",
        schemaVersion: 49,
        syncRunRemoteId: "sync-run-1",
        changes: [],
      }),
    ).rejects.toThrow("Sync authentication token is required.");
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
