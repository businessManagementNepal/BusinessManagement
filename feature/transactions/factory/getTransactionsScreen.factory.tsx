import React, { useCallback, useMemo, useState } from "react";
import { Database } from "@nozbe/watermelondb";
import {
  Account,
  AccountType,
} from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { createLocalAccountDatasource } from "@/feature/setting/accounts/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/setting/accounts/accountSelection/data/repository/account.repository.impl";
import { createLocalUserManagementDatasource } from "@/feature/setting/accounts/userManagement/data/dataSource/local.userManagement.datasource.impl";
import { createUserManagementRepository } from "@/feature/setting/accounts/userManagement/data/repository/userManagement.repository.impl";
import { createLocalAuthUserDatasource } from "@/feature/session/data/dataSource/local.authUser.datasource.impl";
import { createAuthUserRepository } from "@/feature/session/data/repository/authUser.repository.impl";
import { createGetAccessibleAccountsByUserRemoteIdUseCase } from "@/feature/setting/accounts/accountSelection/useCase/getAccessibleAccountsByUserRemoteId.useCase.impl";
import { createLocalTransactionDatasource } from "@/feature/transactions/data/dataSource/local.transaction.datasource.impl";
import { createTransactionRepository } from "@/feature/transactions/data/repository/transaction.repository.impl";
import { createGetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase.impl";
import { createGetTransactionByIdUseCase } from "@/feature/transactions/useCase/getTransactionById.useCase.impl";
import { createAddTransactionUseCase } from "@/feature/transactions/useCase/addTransaction.useCase.impl";
import { createUpdateTransactionUseCase } from "@/feature/transactions/useCase/updateTransaction.useCase.impl";
import { createDeleteTransactionUseCase } from "@/feature/transactions/useCase/deleteTransaction.useCase.impl";
import { useTransactionsListViewModel } from "@/feature/transactions/viewModel/transactionsList.viewModel.impl";
import { useTransactionEditorViewModel } from "@/feature/transactions/viewModel/transactionEditor.viewModel.impl";
import { useTransactionDeleteViewModel } from "@/feature/transactions/viewModel/transactionDelete.viewModel.impl";
import { TransactionsScreen } from "@/feature/transactions/ui/TransactionsScreen";

export type GetTransactionsScreenFactoryProps = {
  database: Database;
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
};

export function GetTransactionsScreenFactory({
  database,
  activeUserRemoteId,
  activeAccountRemoteId,
}: GetTransactionsScreenFactoryProps) {
  const [reloadSignal, setReloadSignal] = useState(0);

  const accountDatasource = useMemo(
    () => createLocalAccountDatasource(database),
    [database],
  );
  const accountRepository = useMemo(
    () => createAccountRepository(accountDatasource),
    [accountDatasource],
  );
  const authUserDatasource = useMemo(
    () => createLocalAuthUserDatasource(database),
    [database],
  );
  const authUserRepository = useMemo(
    () => createAuthUserRepository(authUserDatasource),
    [authUserDatasource],
  );
  const userManagementDatasource = useMemo(
    () => createLocalUserManagementDatasource(database),
    [database],
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

  const transactionDatasource = useMemo(
    () => createLocalTransactionDatasource(database),
    [database],
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
  const addTransactionUseCase = useMemo(
    () => createAddTransactionUseCase(transactionRepository),
    [transactionRepository],
  );
  const updateTransactionUseCase = useMemo(
    () => createUpdateTransactionUseCase(transactionRepository),
    [transactionRepository],
  );
  const deleteTransactionUseCase = useMemo(
    () => createDeleteTransactionUseCase(transactionRepository),
    [transactionRepository],
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

      const result = await getAccessibleAccountsByUserRemoteIdUseCase.execute(
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
        result.value.filter((account) => account.accountType === AccountType.Personal),
      );
    };

    void loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [activeUserRemoteId, getAccessibleAccountsByUserRemoteIdUseCase]);

  const handleReload = useCallback(() => {
    setReloadSignal((currentSignal) => currentSignal + 1);
  }, []);

  const editorViewModel = useTransactionEditorViewModel({
    ownerUserRemoteId: activeUserRemoteId ?? "",
    accounts,
    activeAccountRemoteId,
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
    />
  );
}
