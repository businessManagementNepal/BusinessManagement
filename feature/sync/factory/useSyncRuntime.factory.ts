import { createLocalAccountDatasource } from "@/feature/auth/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/auth/accountSelection/data/repository/account.repository.impl";
import { createGetAccountByRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccountByRemoteId.useCase.impl";
import { ensureDatabaseReady } from "@/shared/database/appDatabase";
import { APP_DATABASE_SCHEMA_VERSION } from "@/shared/database/appDatabaseSchemaVersion";
import { Database } from "@nozbe/watermelondb";
import { useMemo } from "react";

type UseSyncRuntimeFactoryParams = {
  database: Database;
};

export type UseSyncRuntimeFactoryResult = {
  getAccountByRemoteIdUseCase: ReturnType<typeof createGetAccountByRemoteIdUseCase>;
  schemaVersion: number;
  ensureDatabaseReady: typeof ensureDatabaseReady;
};

export const createLocalSyncRuntimeServices = ({
  database,
}: UseSyncRuntimeFactoryParams): UseSyncRuntimeFactoryResult => {
  const accountDatasource = createLocalAccountDatasource(database);
  const accountRepository = createAccountRepository(accountDatasource);
  const getAccountByRemoteIdUseCase =
    createGetAccountByRemoteIdUseCase(accountRepository);

  return {
    getAccountByRemoteIdUseCase,
    schemaVersion: APP_DATABASE_SCHEMA_VERSION,
    ensureDatabaseReady,
  };
};

export const useSyncRuntimeFactory = ({
  database,
}: UseSyncRuntimeFactoryParams): UseSyncRuntimeFactoryResult =>
  useMemo(() => createLocalSyncRuntimeServices({ database }), [database]);
