// @vitest-environment node

import { createLocalAccountDatasource } from "@/feature/auth/accountSelection/data/dataSource/local.account.datasource.impl";
import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import {
  createLocalSyncRuntimeServices,
} from "@/feature/sync/factory/useSyncRuntime.factory";
import { APP_DATABASE_SCHEMA_VERSION } from "@/shared/database/appDatabaseSchemaVersion";
import { createInMemoryWatermelonDatabase } from "@/tests/helpers/inMemoryWatermelonDb.helper";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const remoteFactories = vi.hoisted(() => ({
  createApiConfig: vi.fn(),
  createRemoteSyncAuthClient: vi.fn(),
  createAuthenticatedHttpClient: vi.fn(),
  createRemoteSyncRemoteDatasource: vi.fn(),
  createRemoteSyncIdentityService: vi.fn(),
}));

vi.mock("@/shared/network/apiConfig", () => ({
  createApiConfig: remoteFactories.createApiConfig,
}));

vi.mock("@/feature/sync/auth/remoteSyncAuth.client", () => ({
  createRemoteSyncAuthClient: remoteFactories.createRemoteSyncAuthClient,
}));

vi.mock("@/shared/network/authenticatedHttpClient", () => ({
  createAuthenticatedHttpClient: remoteFactories.createAuthenticatedHttpClient,
}));

vi.mock("@/feature/sync/data/dataSource/remote.syncRemote.datasource.impl", () => ({
  createRemoteSyncRemoteDatasource:
    remoteFactories.createRemoteSyncRemoteDatasource,
}));

vi.mock("@/feature/sync/auth/remoteSyncIdentity.service", () => ({
  createRemoteSyncIdentityService:
    remoteFactories.createRemoteSyncIdentityService,
}));

describe("local-only sync runtime factory", () => {
  let originalApiBaseUrl: string | undefined;
  let originalNodeEnv: string | undefined;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const environment = process.env as Record<string, string | undefined>;
    originalApiBaseUrl = environment.EXPO_PUBLIC_API_BASE_URL;
    originalNodeEnv = environment.NODE_ENV;
    delete environment.EXPO_PUBLIC_API_BASE_URL;
    environment.NODE_ENV = "production";

    fetchMock = vi.fn(async () => {
      throw new Error("Local-only runtime must not make HTTP requests.");
    });
    vi.stubGlobal("fetch", fetchMock);

    for (const factory of Object.values(remoteFactories)) {
      factory.mockReset();
    }
  });

  afterEach(() => {
    const environment = process.env as Record<string, string | undefined>;

    if (originalApiBaseUrl === undefined) {
      delete environment.EXPO_PUBLIC_API_BASE_URL;
    } else {
      environment.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    }

    if (originalNodeEnv === undefined) {
      delete environment.NODE_ENV;
    } else {
      environment.NODE_ENV = originalNodeEnv;
    }

    vi.unstubAllGlobals();
  });

  it("initializes local account services without configuring a backend", async () => {
    const { database } = createInMemoryWatermelonDatabase({
      allowedTables: ["accounts"],
    });
    const accountDatasource = createLocalAccountDatasource(database);
    const savedAccount = await accountDatasource.saveAccount({
      remoteId: "local-account-1",
      ownerUserRemoteId: "local-user-1",
      accountType: AccountType.Personal,
      businessType: null,
      displayName: "Offline Account",
      currencyCode: "NPR",
      cityOrLocation: "Kathmandu",
      countryCode: "NP",
      isActive: true,
      isDefault: true,
    });
    expect(savedAccount.success).toBe(true);

    const localRuntime = createLocalSyncRuntimeServices({ database });
    const accountResult =
      await localRuntime.getAccountByRemoteIdUseCase.execute("local-account-1");

    expect(accountResult.success).toBe(true);
    if (accountResult.success) {
      expect(accountResult.value.displayName).toBe("Offline Account");
    }
    expect(localRuntime.schemaVersion).toBe(APP_DATABASE_SCHEMA_VERSION);
    expect(localRuntime.ensureDatabaseReady).toEqual(expect.any(Function));
    expect(localRuntime).not.toHaveProperty("runtime");
    expect(localRuntime).not.toHaveProperty("remoteSyncIdentityService");
    expect(fetchMock).not.toHaveBeenCalled();

    for (const factory of Object.values(remoteFactories)) {
      expect(factory).not.toHaveBeenCalled();
    }
  });
});
