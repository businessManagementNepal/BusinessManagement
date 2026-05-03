import { createRemoteSyncAuthClient } from "@/feature/sync/auth/remoteSyncAuth.client";
import { createApiConfig } from "@/shared/network/apiConfig";
import { describe, expect, it, vi } from "vitest";

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

const createTokenStore = () => ({
  saveTokens: vi.fn(async () => undefined),
  clearTokens: vi.fn(async () => undefined),
  getAccessToken: vi.fn(async () => null),
  getRefreshToken: vi.fn(async () => null),
  getTokens: vi.fn(async () => null),
});

const getRequestOptions = (
  fetchFn: ReturnType<typeof vi.fn>,
  index: number,
): RequestInit => {
  const call = fetchFn.mock.calls[index] as unknown as [string, RequestInit];
  return call[1];
};

const REMOTE_SESSION_BODY = {
  access: "access-1",
  refresh: "refresh-1",
  user: {
    remote_id: "remote-user-1",
    username: "+9779800000000",
    display_name: "Kapil",
    phone_number: "+9779800000000",
    is_active: true,
  },
  accounts: [
    {
      membership_remote_id: "member-1",
      remote_id: "remote-account-1",
      display_name: "Kapil Store",
      country_code: "NP",
      currency_code: "NPR",
      is_active: true,
      role: "owner",
      status: "active",
    },
  ],
} as const;

describe("remoteSyncAuth.client", () => {
  it("uses the phone-first login endpoint and maps snake_case auth responses", async () => {
    const fetchFn = vi.fn(async () =>
      createFetchResponse({
        ok: true,
        status: 200,
        body: REMOTE_SESSION_BODY,
      }),
    );

    const client = createRemoteSyncAuthClient({
      apiConfig: createApiConfig({
        apiBaseUrl: "https://api.elekha.app",
        mode: "production",
      }),
      tokenStore: createTokenStore() as never,
      fetchFn,
    });

    const result = await client.login({
      username: "+9779800000000",
      password: "secret123",
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenNthCalledWith(
      1,
      "https://api.elekha.app/api/v1/auth/login-phone",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(JSON.parse(String(getRequestOptions(fetchFn, 0).body))).toEqual({
      phone: "+9779800000000",
      password: "secret123",
    });
    expect(result).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      user: {
        remoteId: "remote-user-1",
        username: "+9779800000000",
        email: null,
        displayName: "Kapil",
        phoneNumber: "+9779800000000",
        isActive: true,
      },
      accounts: [
        {
          membershipRemoteId: "member-1",
          remoteId: "remote-account-1",
          displayName: "Kapil Store",
          countryCode: "NP",
          currencyCode: "NPR",
          isActive: true,
          role: "owner",
          status: "active",
        },
      ],
    });
  });

  it("falls back to the legacy login endpoint when the phone-first route is unavailable", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        createFetchResponse({
          ok: false,
          status: 404,
          body: {},
        }),
      )
      .mockResolvedValueOnce(
        createFetchResponse({
          ok: true,
          status: 200,
          body: REMOTE_SESSION_BODY,
        }),
      );

    const client = createRemoteSyncAuthClient({
      apiConfig: createApiConfig({
        apiBaseUrl: "https://api.elekha.app",
        mode: "production",
      }),
      tokenStore: createTokenStore() as never,
      fetchFn,
    });

    await client.login({
      username: "+9779800000000",
      password: "secret123",
    });

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn).toHaveBeenNthCalledWith(
      1,
      "https://api.elekha.app/api/v1/auth/login-phone",
      expect.any(Object),
    );
    expect(fetchFn).toHaveBeenNthCalledWith(
      2,
      "https://api.elekha.app/api/v1/auth/login",
      expect.any(Object),
    );
    expect(JSON.parse(String(getRequestOptions(fetchFn, 1).body))).toEqual({
      username: "+9779800000000",
      password: "secret123",
    });
  });

  it("falls back to the legacy register endpoint when the phone-first route is unavailable", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        createFetchResponse({
          ok: false,
          status: 404,
          body: {},
        }),
      )
      .mockResolvedValueOnce(
        createFetchResponse({
          ok: true,
          status: 200,
          body: REMOTE_SESSION_BODY,
        }),
      );

    const client = createRemoteSyncAuthClient({
      apiConfig: createApiConfig({
        apiBaseUrl: "https://api.elekha.app",
        mode: "production",
      }),
      tokenStore: createTokenStore() as never,
      fetchFn,
    });

    const result = await client.register({
      username: "+9779800000000",
      password: "secret123",
      email: "kapil@example.com",
      displayName: "Kapil",
      phoneNumber: "+9779800000000",
    });

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn).toHaveBeenNthCalledWith(
      1,
      "https://api.elekha.app/api/v1/auth/signup-phone",
      expect.any(Object),
    );
    expect(JSON.parse(String(getRequestOptions(fetchFn, 0).body))).toEqual({
      fullName: "Kapil",
      phone: "+9779800000000",
      email: "kapil@example.com",
      password: "secret123",
    });
    expect(fetchFn).toHaveBeenNthCalledWith(
      2,
      "https://api.elekha.app/api/v1/auth/register",
      expect.any(Object),
    );
    expect(JSON.parse(String(getRequestOptions(fetchFn, 1).body))).toEqual({
      username: "+9779800000000",
      password: "secret123",
      email: "kapil@example.com",
      displayName: "Kapil",
      phoneNumber: "+9779800000000",
    });
    expect(result.accounts[0]).toEqual({
      membershipRemoteId: "member-1",
      remoteId: "remote-account-1",
      displayName: "Kapil Store",
      countryCode: "NP",
      currencyCode: "NPR",
      isActive: true,
      role: "owner",
      status: "active",
    });
  });
});
