import { Database } from "@nozbe/watermelondb";
import { createPasswordHashService } from "@/shared/utils/auth/passwordHash.service";
import { setActiveUserSession } from "@/feature/appSettings/data/appSettings.store";
import { createRemoteSyncAuthClient } from "@/feature/sync/auth/remoteSyncAuth.client";
import { createRemoteSyncIdentityService } from "@/feature/sync/auth/remoteSyncIdentity.service";
import { createLocalSyncIdentityBindingDatasource } from "@/feature/sync/data/dataSource/local.syncIdentityBinding.datasource.impl";
import { createSyncIdentityBindingRepository } from "@/feature/sync/data/repository/syncIdentityBinding.repository.impl";
import { createAuthTokenStore } from "@/shared/auth/authTokenStore";
import { createApiConfig } from "@/shared/network/apiConfig";
import { createLocalAuthUserDatasource } from "@/feature/session/data/dataSource/local.authUser.datasource.impl";
import { createLocalAuthCredentialDatasource } from "@/feature/session/data/dataSource/local.authCredential.datasource.impl";
import { createAuthUserRepository } from "@/feature/session/data/repository/authUser.repository.impl";
import { createAuthCredentialRepository } from "@/feature/session/data/repository/authCredential.repository.impl";
import { createVerifyLocalCredentialUseCase } from "@/feature/session/useCase/verifyLocalCredential.useCase.impl";
import { createLocalLoginRepository } from "../data/repository/login.repository.impl";

export function createLocalLoginRepositoryWithDatabase(database: Database) {
  const authUserDatasource = createLocalAuthUserDatasource(database);
  const authCredentialDatasource =
    createLocalAuthCredentialDatasource(database);

  const authUserRepository = createAuthUserRepository(authUserDatasource);
  const authCredentialRepository = createAuthCredentialRepository(
    authCredentialDatasource,
  );

  const passwordHashService = createPasswordHashService();
  const syncIdentityBindingDatasource =
    createLocalSyncIdentityBindingDatasource(database);
  const syncIdentityBindingRepository =
    createSyncIdentityBindingRepository(syncIdentityBindingDatasource);
  const remoteSyncIdentityService = (() => {
    try {
      const authTokenStore = createAuthTokenStore();
      const remoteAuthClient = createRemoteSyncAuthClient({
        apiConfig: createApiConfig(),
        tokenStore: authTokenStore,
      });

      return createRemoteSyncIdentityService({
        remoteAuthClient,
        tokenStore: authTokenStore,
        bindingRepository: syncIdentityBindingRepository,
      });
    } catch {
      return null;
    }
  })();

  const verifyLocalCredentialUseCase = createVerifyLocalCredentialUseCase(
    authCredentialRepository,
    authUserRepository,
    passwordHashService,
  );

  return createLocalLoginRepository(verifyLocalCredentialUseCase, {
    onAuthenticated: async (verifiedCredential, payload) => {
      await setActiveUserSession(database, verifiedCredential.authUser.remoteId);

      if (!remoteSyncIdentityService) {
        return;
      }

      await remoteSyncIdentityService
        .bootstrapAfterLocalLogin({
          localUser: verifiedCredential.authUser,
          loginId: verifiedCredential.authCredential.loginId || payload.phoneNumber,
          password: payload.password,
        })
        .catch(() => undefined);
    },
  });
}
