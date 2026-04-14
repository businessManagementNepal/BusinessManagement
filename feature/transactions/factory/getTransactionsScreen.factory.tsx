import { createLocalMoneyAccountDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccount.datasource.impl";
import { createMoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository.impl";
import { createGetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase.impl";
import { createLocalAccountDatasource } from "@/feature/auth/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/auth/accountSelection/data/repository/account.repository.impl";
import {
    Account,
    AccountType,
    AccountTypeValue,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import { createGetAccessibleAccountsByUserRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccessibleAccountsByUserRemoteId.useCase.impl";
import { createLocalAuthUserDatasource } from "@/feature/session/data/dataSource/local.authUser.datasource.impl";
import { createAuthUserRepository } from "@/feature/session/data/repository/authUser.repository.impl";
import { createLocalTransactionDatasource } from "@/feature/transactions/data/dataSource/local.transaction.datasource.impl";
import { createTransactionRepository } from "@/feature/transactions/data/repository/transaction.repository.impl";
import { TransactionsScreen } from "@/feature/transactions/ui/TransactionsScreen";
import { createAddTransactionUseCase } from "@/feature/transactions/useCase/addTransaction.useCase.impl";
import { createDeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase.impl";
import { createDeleteTransactionUseCase } from "@/feature/transactions/useCase/deleteTransaction.useCase.impl";
import { createGetTransactionByIdUseCase } from "@/feature/transactions/useCase/getTransactionById.useCase.impl";
import { createGetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase.impl";
import { createPostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase.impl";
import { createUpdateTransactionUseCase } from "@/feature/transactions/useCase/updateTransaction.useCase.impl";
import { useTransactionDeleteViewModel } from "@/feature/transactions/viewModel/transactionDelete.viewModel.impl";
import { useTransactionEditorViewModel } from "@/feature/transactions/viewModel/transactionEditor.viewModel.impl";
import { useTransactionsListViewModel } from "@/feature/transactions/viewModel/transactionsList.viewModel.impl";
import { createLocalUserManagementDatasource } from "@/feature/userManagement/data/dataSource/local.userManagement.datasource.impl";
import { createUserManagementRepository } from "@/feature/userManagement/data/repository/userManagement.repository.impl";
import appDatabase from "@/shared/database/appDatabase";
import React, { useCallback, useMemo, useState } from "react";

export type GetTransactionsScreenFactoryProps = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  accountTypeScope?: AccountTypeValue;
  canManage?: boolean;
};

export function GetTransactionsScreenFactory({
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  accountTypeScope = AccountType.Personal,
  canManage = true,
}: GetTransactionsScreenFactoryProps) {
  const [reloadSignal, setReloadSignal] = useState(0);

  const accountDatasource = useMemo(
    () => createLocalAccountDatasource(appDatabase),
    [],
  );
  const accountRepository = useMemo(
    () => createAccountRepository(accountDatasource),
    [accountDatasource],
  );
  const authUserDatasource = useMemo(
    () => createLocalAuthUserDatasource(appDatabase),
    [],
  );
  const authUserRepository = useMemo(
    () => createAuthUserRepository(authUserDatasource),
    [authUserDatasource],
  );
  const userManagementDatasource = useMemo(
    () => createLocalUserManagementDatasource(appDatabase),
    [],
  );
  const userManagementRepository = useMemo(
    () =>
      createUserManagementRepository({
        localDatasource: userManagementDatasource,
        accountRepository,
        authUserRepository,
      }),
    [accountRepository, authUserRepository, userManagementDatasource],
  );
  const getAccessibleAccountsByUserRemoteIdUseCase = useMemo(
    () =>
      createGetAccessibleAccountsByUserRemoteIdUseCase({
        accountRepository,
        userManagementRepository,
      }),
    [accountRepository, userManagementRepository],
  );
  const moneyAccountDatasource = useMemo(
    () => createLocalMoneyAccountDatasource(appDatabase),
    [],
  );
  const moneyAccountRepository = useMemo(
    () => createMoneyAccountRepository(moneyAccountDatasource),
    [moneyAccountDatasource],
  );
  const getMoneyAccountsUseCase = useMemo(
    () => createGetMoneyAccountsUseCase(moneyAccountRepository),
    [moneyAccountRepository],
  );

  const transactionDatasource = useMemo(
    () => createLocalTransactionDatasource(appDatabase),
    [],
  );
  const transactionRepository = useMemo(
    () => createTransactionRepository(transactionDatasource),
    [transactionDatasource],
  );
  const getTransactionsUseCase = useMemo(
    () => createGetTransactionsUseCase(transactionRepository),
    [transactionRepository],
  );
  const getTransactionByIdUseCase = useMemo(
    () => createGetTransactionByIdUseCase(transactionRepository),
    [transactionRepository],
  );
  const postBusinessTransactionUseCase = useMemo(
    () => createPostBusinessTransactionUseCase(appDatabase),
    [],
  );
  const deleteBusinessTransactionUseCase = useMemo(
    () => createDeleteBusinessTransactionUseCase(appDatabase),
    [],
  );
  const addTransactionUseCase = useMemo(
    () => createAddTransactionUseCase(postBusinessTransactionUseCase),
    [postBusinessTransactionUseCase],
  );
  const updateTransactionUseCase = useMemo(
    () => createUpdateTransactionUseCase(postBusinessTransactionUseCase),
    [postBusinessTransactionUseCase],
  );
  const deleteTransactionUseCase = useMemo(
    () => createDeleteTransactionUseCase(deleteBusinessTransactionUseCase),
    [deleteBusinessTransactionUseCase],
  );

  const [accounts, setAccounts] = useState<readonly Account[]>([]);

  React.useEffect(() => {
    let isMounted = true;

    const loadAccounts = async () => {
      if (!activeUserRemoteId) {
        if (isMounted) {
          setAccounts([]);
        }
        return;
      }

      const result =
        await getAccessibleAccountsByUserRemoteIdUseCase.execute(
          activeUserRemoteId,
        );

      if (!isMounted) {
        return;
      }

      if (!result.success) {
        setAccounts([]);
        return;
      }

      setAccounts(
        result.value.filter(
          (account) => account.accountType === accountTypeScope,
        ),
      );
    };

    void loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [
    accountTypeScope,
    activeUserRemoteId,
    getAccessibleAccountsByUserRemoteIdUseCase,
  ]);

  const handleReload = useCallback(() => {
    setReloadSignal((currentSignal) => currentSignal + 1);
  }, []);

  const editorViewModel = useTransactionEditorViewModel({
    ownerUserRemoteId: activeUserRemoteId ?? "",
    accounts,
    activeAccountRemoteId,
    getMoneyAccountsUseCase,
    getTransactionByIdUseCase,
    addTransactionUseCase,
    updateTransactionUseCase,
    onSaved: handleReload,
  });

  const deleteViewModel = useTransactionDeleteViewModel(
    deleteTransactionUseCase,
    handleReload,
  );

  const listViewModel = useTransactionsListViewModel({
    ownerUserRemoteId: activeUserRemoteId ?? "",
    activeAccountRemoteId,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
    getTransactionsUseCase,
    onOpenCreate: editorViewModel.openCreate,
    onOpenEdit: editorViewModel.openEdit,
    reloadSignal,
  });

  return (
    <TransactionsScreen
      listViewModel={listViewModel}
      editorViewModel={editorViewModel}
      deleteViewModel={deleteViewModel}
      canManage={canManage}
    />
  );
}
