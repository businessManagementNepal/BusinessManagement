import { Database } from "@nozbe/watermelondb";
import { createPasswordHashService } from "@/shared/utils/auth/passwordHash.service";
import { setActiveUserSession } from "@/feature/session/data/appSession.store";
import { createLocalAuthUserDatasource } from "@/feature/session/data/dataSource/local.authUser.datasource.impl";
import { createLocalAuthCredentialDatasource } from "@/feature/session/data/dataSource/local.authCredential.datasource.impl";
import { createAuthUserRepository } from "@/feature/session/data/repository/authUser.repository.impl";
import { createAuthCredentialRepository } from "@/feature/session/data/repository/authCredential.repository.impl";
import { createVerifyLocalCredentialUseCase } from "@/feature/session/useCase/verifyLocalCredential.useCase.impl";
import { createLocalLoginRepository } from "../data/repositiory/login.repository.impl";

export function createLocalLoginRepositoryWithDatabase(database: Database) {
  const authUserDatasource = createLocalAuthUserDatasource(database);
  const authCredentialDatasource =
    createLocalAuthCredentialDatasource(database);

  const authUserRepository = createAuthUserRepository(authUserDatasource);
  const authCredentialRepository = createAuthCredentialRepository(
    authCredentialDatasource,
  );

  const passwordHashService = createPasswordHashService();

  const verifyLocalCredentialUseCase = createVerifyLocalCredentialUseCase(
    authCredentialRepository,
    authUserRepository,
    passwordHashService,
  );

  return createLocalLoginRepository(verifyLocalCredentialUseCase, {
    onAuthenticated: async (verifiedCredential) => {
      await setActiveUserSession(database, verifiedCredential.authUser.remoteId);
    },
  });
}