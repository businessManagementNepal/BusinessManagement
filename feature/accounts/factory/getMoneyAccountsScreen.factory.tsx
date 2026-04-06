import React from "react";
import appDatabase from "@/shared/database/appDatabase";
import { createLocalMoneyAccountDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccount.datasource.impl";
import { createMoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository.impl";
import { createGetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase.impl";
import { createSaveMoneyAccountUseCase } from "@/feature/accounts/useCase/saveMoneyAccount.useCase.impl";
import { createArchiveMoneyAccountUseCase } from "@/feature/accounts/useCase/archiveMoneyAccount.useCase.impl";
import { useMoneyAccountsViewModel } from "@/feature/accounts/viewModel/moneyAccounts.viewModel.impl";
import { MoneyAccountsScreen } from "@/feature/accounts/ui/MoneyAccountsScreen";

type GetMoneyAccountsScreenFactoryProps = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  canManage: boolean;
};

export function GetMoneyAccountsScreenFactory({
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  canManage,
}: GetMoneyAccountsScreenFactoryProps): React.ReactElement {
  const datasource = React.useMemo(
    () => createLocalMoneyAccountDatasource(appDatabase),
    [],
  );

  const repository = React.useMemo(
    () => createMoneyAccountRepository(datasource),
    [datasource],
  );

  const getMoneyAccountsUseCase = React.useMemo(
    () => createGetMoneyAccountsUseCase(repository),
    [repository],
  );

  const saveMoneyAccountUseCase = React.useMemo(
    () => createSaveMoneyAccountUseCase(repository),
    [repository],
  );
  const archiveMoneyAccountUseCase = React.useMemo(
    () => createArchiveMoneyAccountUseCase(repository),
    [repository],
  );

  const viewModel = useMoneyAccountsViewModel({
    activeUserRemoteId,
    scopeAccountRemoteId: activeAccountRemoteId,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
    canManage,
    getMoneyAccountsUseCase,
    saveMoneyAccountUseCase,
    archiveMoneyAccountUseCase,
  });

  return <MoneyAccountsScreen viewModel={viewModel} />;
}
