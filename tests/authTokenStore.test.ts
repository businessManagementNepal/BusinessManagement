import { describe, expect, it, vi } from "vitest";

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

import { createAuthTokenStore } from "@/shared/auth/authTokenStore";

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

describe("authTokenStore", () => {
  it("saves, reads, and clears tokens in secure storage", async () => {
    const { secureStore } = createSecureStoreMock();
    const tokenStore = createAuthTokenStore({ secureStore });

    await tokenStore.saveTokens({
      accessToken: "access-123",
      refreshToken: "refresh-123",
    });

    expect(await tokenStore.getTokens()).toEqual({
      accessToken: "access-123",
      refreshToken: "refresh-123",
    });

    await tokenStore.clearTokens();
    expect(await tokenStore.getTokens()).toBeNull();
  });
});
