import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { createRemoteSyncIdentityService } from "@/feature/sync/auth/remoteSyncIdentity.service";
import { createHttpRequestError } from "@/shared/network/networkError";
import { describe, expect, it, vi } from "vitest";

const LOCAL_USER = {
  remoteId: "local-user-1",
  fullName: "Kapil",
  email: null,
  phone: "+9779800000000",
  authProvider: null,
  profileImageUrl: null,
  preferredLanguage: null,
  isEmailVerified: false,
  isPhoneVerified: false,
  createdAt: 1,
  updatedAt: 1,
} as const;

const REMOTE_SESSION = {
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
  accounts: [],
} as const;

describe("remoteSyncIdentity.service", () => {
  it("falls back to backend registration after a login 401 and persists the linked user", async () => {
    const tokenStore = {
      saveTokens: vi.fn(async () => undefined),
      clearTokens: vi.fn(async () => undefined),
    };
    const bindingRepository = {
      saveUserBinding: vi.fn(async () => ({
        success: true as const,
        value: {
          localUserRemoteId: "local-user-1",
          remoteUserRemoteId: "remote-user-1",
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    };
    const remoteAuthClient = {
      login: vi.fn(async () => {
        throw createHttpRequestError(401);
      }),
      register: vi.fn(async () => REMOTE_SESSION),
    };

    const service = createRemoteSyncIdentityService({
      remoteAuthClient: remoteAuthClient as never,
      tokenStore: tokenStore as never,
      bindingRepository: bindingRepository as never,
    });

    const result = await service.bootstrapAfterLocalLogin({
      localUser: LOCAL_USER,
      loginId: "+9779800000000",
      password: "secret123",
    });

    expect(result.success).toBe(true);
    expect(remoteAuthClient.login).toHaveBeenCalledTimes(1);
    expect(remoteAuthClient.register).toHaveBeenCalledTimes(1);
    expect(remoteAuthClient.register).toHaveBeenCalledWith({
      username: "+9779800000000",
      password: "secret123",
      displayName: "Kapil",
      phoneNumber: "+9779800000000",
    });
    expect(tokenStore.saveTokens).toHaveBeenCalledWith({
      accessToken: "access-1",
      refreshToken: "refresh-1",
    });
    expect(bindingRepository.saveUserBinding).toHaveBeenCalledWith({
      localUserRemoteId: "local-user-1",
      remoteUserRemoteId: "remote-user-1",
    });
  });

  it("creates and stores a backend business-account binding on demand", async () => {
    const bindingRepository = {
      getAccountBindingByLocalAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: null,
      })),
      getUserBindingByLocalUserRemoteId: vi.fn(async () => ({
        success: true as const,
        value: {
          localUserRemoteId: "local-user-1",
          remoteUserRemoteId: "remote-user-1",
          createdAt: 1,
          updatedAt: 1,
        },
      })),
      saveAccountBinding: vi.fn(async () => ({
        success: true as const,
        value: {
          localUserRemoteId: "local-user-1",
          remoteUserRemoteId: "remote-user-1",
          localAccountRemoteId: "local-account-1",
          remoteAccountRemoteId: "remote-account-1",
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    };
    const remoteAuthClient = {
      createBusinessAccount: vi.fn(async () => ({
        membershipRemoteId: "member-1",
        remoteId: "remote-account-1",
        displayName: "Kapil Store",
        countryCode: "NP",
        currencyCode: "NPR",
        isActive: true,
        role: "owner",
        status: "active",
      })),
    };

    const service = createRemoteSyncIdentityService({
      remoteAuthClient: remoteAuthClient as never,
      tokenStore: {
        saveTokens: vi.fn(),
        clearTokens: vi.fn(),
      } as never,
      bindingRepository: bindingRepository as never,
    });

    const result = await service.ensureRemoteBusinessAccountBinding({
      localUserRemoteId: "local-user-1",
      localAccount: {
        remoteId: "local-account-1",
        ownerUserRemoteId: "local-user-1",
        accountType: AccountType.Business,
        businessType: null,
        displayName: "Kapil Store",
        currencyCode: "NPR",
        cityOrLocation: null,
        countryCode: "NP",
        isActive: true,
        isDefault: true,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    expect(result.success).toBe(true);
    expect(remoteAuthClient.createBusinessAccount).toHaveBeenCalledWith({
      displayName: "Kapil Store",
      countryCode: "NP",
      currencyCode: "NPR",
    });
    expect(bindingRepository.saveAccountBinding).toHaveBeenCalledWith({
      localUserRemoteId: "local-user-1",
      remoteUserRemoteId: "remote-user-1",
      localAccountRemoteId: "local-account-1",
      remoteAccountRemoteId: "remote-account-1",
    });
  });
});
