import { clearActiveUserSession } from "@/feature/appSettings/data/appSettings.store";
import { createLocalAccountDatasource } from "@/feature/auth/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/auth/accountSelection/data/repository/account.repository.impl";
import { createGetAccountByRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccountByRemoteId.useCase.impl";
import { createAuthTokenStore } from "@/shared/auth/authTokenStore";
import { createDeviceIdStore } from "@/shared/device/deviceIdStore";
import { ensureDatabaseReady } from "@/shared/database/appDatabase";
import { APP_DATABASE_SCHEMA_VERSION } from "@/shared/database/appDatabaseSchemaVersion";
import { createApiConfig } from "@/shared/network/apiConfig";
import { createAuthenticatedHttpClient } from "@/shared/network/authenticatedHttpClient";
import { Database } from "@nozbe/watermelondb";
import { useMemo } from "react";
import { createSecureSyncAuthHeaderAdapter } from "../data/adapter/secure.syncAuthHeader.adapter.impl";
import { createRemoteSyncRemoteDatasource } from "../data/dataSource/remote.syncRemote.datasource.impl";
import { SyncRuntime, createSyncRuntime } from "./createSyncRuntime.factory";

type UseSyncRuntimeFactoryParams = {
  database: Database;
};

export type UseSyncRuntimeFactoryResult = {
  runtime: SyncRuntime | null;
  runtimeError: Error | null;
  getAccountByRemoteIdUseCase: ReturnType<typeof createGetAccountByRemoteIdUseCase>;
  authTokenStore: ReturnType<typeof createAuthTokenStore>;
  deviceIdStore: ReturnType<typeof createDeviceIdStore>;
  schemaVersion: number;
  ensureDatabaseReady: typeof ensureDatabaseReady;
};

export const useSyncRuntimeFactory = ({
  database,
}: UseSyncRuntimeFactoryParams): UseSyncRuntimeFactoryResult => {
  const accountDatasource = useMemo(
    () => createLocalAccountDatasource(database),
    [database],
  );
  const accountRepository = useMemo(
    () => createAccountRepository(accountDatasource),
    [accountDatasource],
  );
  const getAccountByRemoteIdUseCase = useMemo(
    () => createGetAccountByRemoteIdUseCase(accountRepository),
    [accountRepository],
  );

  const authTokenStore = useMemo(() => createAuthTokenStore(), []);
  const deviceIdStore = useMemo(() => createDeviceIdStore(), []);

  const authHeaderAdapter = useMemo(
    () =>
      createSecureSyncAuthHeaderAdapter({
        tokenStore: authTokenStore,
      }),
    [authTokenStore],
  );

  const { runtime, runtimeError } = useMemo(() => {
    try {
      const apiConfig = createApiConfig();
      const httpClient = createAuthenticatedHttpClient({
        apiConfig,
        getAuthHeaders: () => authHeaderAdapter.getAuthHeaders(),
        tokenStore: authTokenStore,
        onAuthFailure: async () => {
          await clearActiveUserSession(database);
        },
      });

      const remoteDatasource = createRemoteSyncRemoteDatasource({
        apiBaseUrl: apiConfig.baseUrl,
        authHeaderAdapter,
        httpClient,
      });

      return {
        runtime: createSyncRuntime(database, remoteDatasource),
        runtimeError: null,
      };
    } catch (error) {
      return {
        runtime: null,
        runtimeError:
          error instanceof Error
            ? error
            : new Error("Sync runtime could not be configured."),
      };
    }
  }, [authHeaderAdapter, authTokenStore, database]);

  return {
    runtime,
    runtimeError,
    getAccountByRemoteIdUseCase,
    authTokenStore,
    deviceIdStore,
    schemaVersion: APP_DATABASE_SCHEMA_VERSION,
    ensureDatabaseReady,
  };
};
