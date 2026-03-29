import React from "react";
import { Database } from "@nozbe/watermelondb";
import { createLocalAccountDatasource } from "../data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "../data/repository/account.repository.impl";
import { createGetAccountsByOwnerUserRemoteIdUseCase } from "../useCase/getAccountsByOwnerUserRemoteId.useCase.impl";
import { createSaveAccountUseCase } from "../useCase/saveAccount.useCase.impl";
import { useAccountSelectionViewModel } from "../viewModel/accountSelection.viewModel.impl";
import { AccountSelectionScreen } from "../ui/AccountSelectionScreen";

type GetAccountSelectionScreenFactoryProps = {
  database: Database;
  onBackToLogin: () => void;
  onAccountSelected?: (accountRemoteId: string) => Promise<void> | void;
};

export function GetAccountSelectionScreenFactory({
  database,
  onBackToLogin,
  onAccountSelected,
}: GetAccountSelectionScreenFactoryProps) {
  const accountDatasource = React.useMemo(
    () => createLocalAccountDatasource(database),
    [database],
  );

  const accountRepository = React.useMemo(
    () => createAccountRepository(accountDatasource),
    [accountDatasource],
  );

  const getAccountsByOwnerUserRemoteIdUseCase = React.useMemo(
    () => createGetAccountsByOwnerUserRemoteIdUseCase(accountRepository),
    [accountRepository],
  );

  const saveAccountUseCase = React.useMemo(
    () => createSaveAccountUseCase(accountRepository),
    [accountRepository],
  );

  const viewModel = useAccountSelectionViewModel({
    database,
    getAccountsByOwnerUserRemoteIdUseCase,
    saveAccountUseCase,
    onBackToLogin,
    onAccountSelected,
  });

  return <AccountSelectionScreen viewModel={viewModel} />;
}
