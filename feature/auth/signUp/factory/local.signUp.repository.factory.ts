import { setActiveUserSession } from "@/feature/appSettings/data/appSettings.store";
import { createLocalAccountDatasource } from "@/feature/auth/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/auth/accountSelection/data/repository/account.repository.impl";
import { createSaveAccountUseCase } from "@/feature/auth/accountSelection/useCase/saveAccount.useCase.impl";
import { createLocalAuthCredentialDatasource } from "@/feature/session/data/dataSource/local.authCredential.datasource.impl";
import { createLocalAuthUserDatasource } from "@/feature/session/data/dataSource/local.authUser.datasource.impl";
import { createAuthCredentialRepository } from "@/feature/session/data/repository/authCredential.repository.impl";
import { createAuthUserRepository } from "@/feature/session/data/repository/authUser.repository.impl";
import { createGetActiveAuthCredentialByLoginIdUseCase } from "@/feature/session/useCase/getActiveAuthCredentialByLoginId.useCase.impl";
import { createSaveAuthCredentialUseCase } from "@/feature/session/useCase/saveAuthCredential.useCase.impl";
import { createSaveAuthUserUseCase } from "@/feature/session/useCase/saveAuthUser.useCase.impl";
import { createPasswordHashService } from "@/shared/utils/auth/passwordHash.service";
import { Database } from "@nozbe/watermelondb";
import { createLocalSignUpRepository } from "../data/repository/signUp.repository.impl";
import { createRegisterUserWithDefaultAccountUseCase } from "../useCase/registerUserWithDefaultAccount.useCase.impl";

export function createLocalSignUpRepositoryWithDatabase(database: Database) {
  const authUserDatasource = createLocalAuthUserDatasource(database);
  const authCredentialDatasource =
    createLocalAuthCredentialDatasource(database);
  const accountDatasource = createLocalAccountDatasource(database);

  const authUserRepository = createAuthUserRepository(authUserDatasource);
  const authCredentialRepository = createAuthCredentialRepository(
    authCredentialDatasource,
  );
  const accountRepository = createAccountRepository(accountDatasource);

  const getActiveAuthCredentialByLoginIdUseCase =
    createGetActiveAuthCredentialByLoginIdUseCase(authCredentialRepository);
  const saveAuthUserUseCase = createSaveAuthUserUseCase(authUserRepository);
  const saveAuthCredentialUseCase = createSaveAuthCredentialUseCase(
    authCredentialRepository,
  );
  const saveAccountUseCase = createSaveAccountUseCase(accountRepository);
  const passwordHashService = createPasswordHashService();
  const registerUserWithDefaultAccountUseCase =
    createRegisterUserWithDefaultAccountUseCase({
      getActiveAuthCredentialByLoginIdUseCase,
      saveAuthUserUseCase,
      saveAuthCredentialUseCase,
      saveAccountUseCase,
      authUserRepository,
      authCredentialRepository,
      passwordHashService,
    });

  return createLocalSignUpRepository(registerUserWithDefaultAccountUseCase, {
    onRegistered: async (verifiedCredential) => {
      await setActiveUserSession(
        database,
        verifiedCredential.authUser.remoteId,
      );
    },
  });
}
