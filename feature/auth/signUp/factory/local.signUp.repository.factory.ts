import { Database } from "@nozbe/watermelondb";
import { createPasswordHashService } from "@/shared/utils/auth/passwordHash.service";
import { setActiveUserSession } from "@/feature/appSettings/data/appSettings.store";
import { createLocalAuthUserDatasource } from "@/feature/session/data/dataSource/local.authUser.datasource.impl";
import { createLocalAuthCredentialDatasource } from "@/feature/session/data/dataSource/local.authCredential.datasource.impl";
import { createAuthUserRepository } from "@/feature/session/data/repository/authUser.repository.impl";
import { createAuthCredentialRepository } from "@/feature/session/data/repository/authCredential.repository.impl";
import { createGetActiveAuthCredentialByLoginIdUseCase } from "@/feature/session/useCase/getActiveAuthCredentialByLoginId.useCase.impl";
import { createSaveAuthCredentialUseCase } from "@/feature/session/useCase/saveAuthCredential.useCase.impl";
import { createSaveAuthUserUseCase } from "@/feature/session/useCase/saveAuthUser.useCase.impl";
import { createLocalSignUpRepository } from "../data/repositiory/signUp.repository.impl";

export function createLocalSignUpRepositoryWithDatabase(database: Database) {
  const authUserDatasource = createLocalAuthUserDatasource(database);
  const authCredentialDatasource =
    createLocalAuthCredentialDatasource(database);

  const authUserRepository = createAuthUserRepository(authUserDatasource);
  const authCredentialRepository = createAuthCredentialRepository(
    authCredentialDatasource,
  );

  const getActiveAuthCredentialByLoginIdUseCase =
    createGetActiveAuthCredentialByLoginIdUseCase(authCredentialRepository);
  const saveAuthUserUseCase = createSaveAuthUserUseCase(authUserRepository);
  const saveAuthCredentialUseCase =
    createSaveAuthCredentialUseCase(authCredentialRepository);
  const passwordHashService = createPasswordHashService();

  return createLocalSignUpRepository(
    getActiveAuthCredentialByLoginIdUseCase,
    saveAuthUserUseCase,
    saveAuthCredentialUseCase,
    passwordHashService,
    {
      onRegistered: async (verifiedCredential) => {
        await setActiveUserSession(database, verifiedCredential.authUser.remoteId);
      },
    },
  );
}

