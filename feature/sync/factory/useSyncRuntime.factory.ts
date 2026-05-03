import { clearActiveUserSession } from "@/feature/appSettings/data/appSettings.store";
import { createLocalAccountDatasource } from "@/feature/auth/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/auth/accountSelection/data/repository/account.repository.impl";
import { createGetAccountByRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccountByRemoteId.useCase.impl";
import { createRemoteSyncAuthClient } from "@/feature/sync/auth/remoteSyncAuth.client";
import { createRemoteSyncIdentityService } from "@/feature/sync/auth/remoteSyncIdentity.service";
import { createAuthTokenStore } from "@/shared/auth/authTokenStore";
import { createDeviceIdStore } from "@/shared/device/deviceIdStore";
import { ensureDatabaseReady } from "@/shared/database/appDatabase";
import { APP_DATABASE_SCHEMA_VERSION } from "@/shared/database/appDatabaseSchemaVersion";
import { createApiConfig } from "@/shared/network/apiConfig";
import { createAuthenticatedHttpClient } from "@/shared/network/authenticatedHttpClient";
import { Database } from "@nozbe/watermelondb";
import { useMemo } from "react";
import { createSecureSyncAuthHeaderAdapter } from "../data/adapter/secure.syncAuthHeader.adapter.impl";
import { createLocalSyncIdentityBindingDatasource } from "../data/dataSource/local.syncIdentityBinding.datasource.impl";
import { createRemoteSyncRemoteDatasource } from "../data/dataSource/remote.syncRemote.datasource.impl";
import { createSyncIdentityBindingRepository } from "../data/repository/syncIdentityBinding.repository.impl";
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
  syncIdentityBindingRepository: ReturnType<
    typeof createSyncIdentityBindingRepository
  >;
  remoteSyncIdentityService: ReturnType<
    typeof createRemoteSyncIdentityService
  > | null;
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
  const syncIdentityBindingDatasource = useMemo(
    () => createLocalSyncIdentityBindingDatasource(database),
    [database],
  );
  const syncIdentityBindingRepository = useMemo(
    () => createSyncIdentityBindingRepository(syncIdentityBindingDatasource),
    [syncIdentityBindingDatasource],
  );

  const authHeaderAdapter = useMemo(
    () =>
      createSecureSyncAuthHeaderAdapter({
        tokenStore: authTokenStore,
      }),
    [authTokenStore],
  );

  const { runtime, runtimeError, remoteSyncIdentityService } = useMemo(() => {
    try {
      const apiConfig = createApiConfig();
      const remoteAuthClient = createRemoteSyncAuthClient({
        apiConfig,
        tokenStore: authTokenStore,
      });
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
        remoteSyncIdentityService: createRemoteSyncIdentityService({
          remoteAuthClient,
          tokenStore: authTokenStore,
          bindingRepository: syncIdentityBindingRepository,
        }),
      };
    } catch (error) {
      return {
        runtime: null,
        runtimeError:
          error instanceof Error
            ? error
            : new Error("Sync runtime could not be configured."),
        remoteSyncIdentityService: null,
      };
    }
  }, [
    authHeaderAdapter,
    authTokenStore,
    database,
    syncIdentityBindingRepository,
  ]);

  return {
    runtime,
    runtimeError,
    getAccountByRemoteIdUseCase,
    authTokenStore,
    deviceIdStore,
    syncIdentityBindingRepository,
    remoteSyncIdentityService,
    schemaVersion: APP_DATABASE_SCHEMA_VERSION,
    ensureDatabaseReady,
  };
};
