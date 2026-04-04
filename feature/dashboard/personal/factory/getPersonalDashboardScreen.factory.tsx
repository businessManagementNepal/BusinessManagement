import React from "react";
import appDatabase from "@/shared/database/appDatabase";
import { createLocalTransactionDatasource } from "@/feature/transactions/data/dataSource/local.transaction.datasource.impl";
import { createTransactionRepository } from "@/feature/transactions/data/repository/transaction.repository.impl";
import { createGetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase.impl";
import { usePersonalDashboardViewModel } from "../viewModel/personalDashboard.viewModel.impl";
import { PersonalDashboardScreen } from "../ui/PersonalDashboardScreen";

type GetPersonalDashboardScreenFactoryProps = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
};

export function GetPersonalDashboardScreenFactory({
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
}: GetPersonalDashboardScreenFactoryProps) {
  const transactionDatasource = React.useMemo(
    () => createLocalTransactionDatasource(appDatabase),
    [],
  );

  const transactionRepository = React.useMemo(
    () => createTransactionRepository(transactionDatasource),
    [transactionDatasource],
  );

  const getTransactionsUseCase = React.useMemo(
    () => createGetTransactionsUseCase(transactionRepository),
    [transactionRepository],
  );

  const viewModel = usePersonalDashboardViewModel({
    activeUserRemoteId,
    activeAccountRemoteId,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
    getTransactionsUseCase,
  });

  return <PersonalDashboardScreen viewModel={viewModel} />;
}
