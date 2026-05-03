import { describe, expect, it, vi } from "vitest";

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

import { createAuthTokenStore } from "@/shared/auth/authTokenStore";
import { createAuthenticatedHttpClient } from "@/shared/network/authenticatedHttpClient";
import { createApiConfig } from "@/shared/network/apiConfig";
import { createSecureSyncAuthHeaderAdapter } from "@/feature/sync/data/adapter/secure.syncAuthHeader.adapter.impl";

const createSecureStoreMock = () => {
  const state = new Map<string, string>();

  return {
    state,
    secureStore: {
      getItemAsync: vi.fn(async (key: string) => state.get(key) ?? null),
      setItemAsync: vi.fn(async (key: string, value: string) => {
        state.set(key, value);
      }),
      deleteItemAsync: vi.fn(async (key: string) => {
        state.delete(key);
      }),
    },
  };
};

const createFetchResponse = (input: {
  ok: boolean;
  status: number;
  body: unknown;
}) =>
  ({
    ok: input.ok,
    status: input.status,
    json: async () => input.body,
  }) as Response;

describe("authenticatedHttpClient", () => {
  it("includes a Bearer access token in auth headers", async () => {
    const { secureStore } = createSecureStoreMock();
    const tokenStore = createAuthTokenStore({ secureStore });
    await tokenStore.saveTokens({
      accessToken: "access-123",
      refreshToken: "refresh-123",
    });

    const authHeaderAdapter = createSecureSyncAuthHeaderAdapter({
      tokenStore,
    });
    const fetchFn = vi.fn(async () =>
      createFetchResponse({
        ok: true,
        status: 200,
        body: { acknowledgements: [] },
      }),
    );
    const client = createAuthenticatedHttpClient({
      apiConfig: createApiConfig({
        apiBaseUrl: "https://api.elekha.app",
        mode: "production",
      }),
      getAuthHeaders: () => authHeaderAdapter.getAuthHeaders(),
      tokenStore,
      fetchFn,
    });

    await client.postJson("/api/v1/sync/push", { changes: [] });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.elekha.app/api/v1/sync/push",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-123",
        }),
      }),
    );
  });

  it("throws a safe auth error when no access token exists", async () => {
    const { secureStore } = createSecureStoreMock();
    const tokenStore = createAuthTokenStore({ secureStore });
    const authHeaderAdapter = createSecureSyncAuthHeaderAdapter({
      tokenStore,
    });
    const client = createAuthenticatedHttpClient({
      apiConfig: createApiConfig({
        apiBaseUrl: "https://api.elekha.app",
        mode: "production",
      }),
      getAuthHeaders: () => authHeaderAdapter.getAuthHeaders(),
      tokenStore,
      fetchFn: vi.fn(),
    });

    await expect(
      client.postJson("/api/v1/sync/push", { changes: [] }),
    ).rejects.toThrow("Sync authentication token is required.");
  });

  it("does not log token values during authenticated requests", async () => {
    const { secureStore } = createSecureStoreMock();
    const tokenStore = createAuthTokenStore({ secureStore });
    await tokenStore.saveTokens({
      accessToken: "access-secret",
      refreshToken: "refresh-secret",
    });

    const authHeaderAdapter = createSecureSyncAuthHeaderAdapter({
      tokenStore,
    });
    const fetchFn = vi.fn(async () =>
      createFetchResponse({
        ok: true,
        status: 200,
        body: { acknowledgements: [] },
      }),
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const client = createAuthenticatedHttpClient({
      apiConfig: createApiConfig({
        apiBaseUrl: "https://api.elekha.app",
        mode: "production",
      }),
      getAuthHeaders: () => authHeaderAdapter.getAuthHeaders(),
      tokenStore,
      fetchFn,
    });

    await client.postJson("/api/v1/sync/push", { changes: [] });

    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("access-secret"),
    );
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("refresh-secret"),
    );

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("refreshes once after a 401 and retries successfully", async () => {
    const { secureStore } = createSecureStoreMock();
    const tokenStore = createAuthTokenStore({ secureStore });
    await tokenStore.saveTokens({
      accessToken: "expired-access",
      refreshToken: "refresh-123",
    });

    const authHeaderAdapter = createSecureSyncAuthHeaderAdapter({
      tokenStore,
    });
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        createFetchResponse({
          ok: false,
          status: 401,
          body: {},
        }),
      )
      .mockResolvedValueOnce(
        createFetchResponse({
          ok: true,
          status: 200,
          body: { acknowledgements: [] },
        }),
      );

    const client = createAuthenticatedHttpClient({
      apiConfig: createApiConfig({
        apiBaseUrl: "https://api.elekha.app",
        mode: "production",
      }),
      getAuthHeaders: () => authHeaderAdapter.getAuthHeaders(),
      tokenStore,
      fetchFn,
      refreshAuthSession: vi.fn(async () => ({
        accessToken: "fresh-access",
        refreshToken: "fresh-refresh",
      })),
    });

    await client.postJson("/api/v1/sync/push", { changes: [] });

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(await tokenStore.getTokens()).toEqual({
      accessToken: "fresh-access",
      refreshToken: "fresh-refresh",
    });
  });

  it("clears the session safely when refresh fails", async () => {
    const { secureStore } = createSecureStoreMock();
    const tokenStore = createAuthTokenStore({ secureStore });
    await tokenStore.saveTokens({
      accessToken: "expired-access",
      refreshToken: "refresh-123",
    });

    const authHeaderAdapter = createSecureSyncAuthHeaderAdapter({
      tokenStore,
    });
    const onAuthFailure = vi.fn(async () => undefined);
    const client = createAuthenticatedHttpClient({
      apiConfig: createApiConfig({
        apiBaseUrl: "https://api.elekha.app",
        mode: "production",
      }),
      getAuthHeaders: () => authHeaderAdapter.getAuthHeaders(),
      tokenStore,
      fetchFn: vi.fn(async () =>
        createFetchResponse({
          ok: false,
          status: 401,
          body: {},
        }),
      ),
      refreshAuthSession: vi.fn(async () => {
        throw new Error("refresh failed");
      }),
      onAuthFailure,
    });

    await expect(
      client.postJson("/api/v1/sync/push", { changes: [] }),
    ).rejects.toThrow("Authentication refresh failed. Sign in again.");

    expect(await tokenStore.getTokens()).toBeNull();
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });
});
