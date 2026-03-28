import { Database } from "@nozbe/watermelondb";
import { createPasswordHashService } from "@/shared/utils/auth/passwordHash.service";
import * as Crypto from "expo-crypto";
import { createLocalAuthUserDatasource } from "@/feature/session/data/dataSource/local.authUser.datasource.impl";
import { createLocalAuthCredentialDatasource } from "@/feature/session/data/dataSource/local.authCredential.datasource.impl";
import { createAuthUserRepository } from "@/feature/session/data/repository/authUser.repository.impl";
import { createAuthCredentialRepository } from "@/feature/session/data/repository/authCredential.repository.impl";
import { createGetActiveAuthCredentialByLoginIdUseCase } from "@/feature/session/useCase/getActiveAuthCredentialByLoginId.useCase.impl";
import { createSaveAuthCredentialUseCase } from "@/feature/session/useCase/saveAuthCredential.useCase.impl";
import { createSaveAuthUserUseCase } from "@/feature/session/useCase/saveAuthUser.useCase.impl";
import { SignUpProfileType } from "../types/signUp.types";
import { createLocalSignUpRepository } from "../data/repositiory/signUp.repository.impl";
import { createLocalAccountDatasource } from "@/feature/setting/accounts/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/setting/accounts/accountSelection/data/repository/account.repository.impl";
import { createSaveAccountUseCase } from "@/feature/setting/accounts/accountSelection/useCase/saveAccount.useCase.impl";

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
  const saveAuthCredentialUseCase =
    createSaveAuthCredentialUseCase(authCredentialRepository);
  const saveAccountUseCase = createSaveAccountUseCase(accountRepository);
  const passwordHashService = createPasswordHashService();

  return createLocalSignUpRepository(
    getActiveAuthCredentialByLoginIdUseCase,
    saveAuthUserUseCase,
    saveAuthCredentialUseCase,
    passwordHashService,
    {
      onRegistered: async (verifiedCredential, payload) => {
        const saveAccountResult = await saveAccountUseCase.execute({
          remoteId: Crypto.randomUUID(),
          ownerUserRemoteId: verifiedCredential.authUser.remoteId,
          accountType: payload.profileType,
          businessType:
            payload.profileType === SignUpProfileType.Business
              ? payload.businessType
              : null,
          displayName: payload.fullName,
          currencyCode: null,
          cityOrLocation: null,
          countryCode: null,
          isActive: true,
          isDefault: true,
        });

        if (!saveAccountResult.success) {
          throw new Error(saveAccountResult.error.message);
        }
      },
    },
  );
}

