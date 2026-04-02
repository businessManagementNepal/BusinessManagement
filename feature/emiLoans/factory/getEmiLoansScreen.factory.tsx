import React, { useCallback, useMemo, useState } from "react";
import { Database } from "@nozbe/watermelondb";
import { createLocalAccountDatasource } from "@/feature/setting/accounts/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/setting/accounts/accountSelection/data/repository/account.repository.impl";
import { createLocalUserManagementDatasource } from "@/feature/setting/accounts/userManagement/data/dataSource/local.userManagement.datasource.impl";
import { createUserManagementRepository } from "@/feature/setting/accounts/userManagement/data/repository/userManagement.repository.impl";
import { createLocalAuthUserDatasource } from "@/feature/session/data/dataSource/local.authUser.datasource.impl";
import { createAuthUserRepository } from "@/feature/session/data/repository/authUser.repository.impl";
import { createGetAccessibleAccountsByUserRemoteIdUseCase } from "@/feature/setting/accounts/accountSelection/useCase/getAccessibleAccountsByUserRemoteId.useCase.impl";
import {
  Account,
  AccountType,
  AccountTypeValue,
} from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { createLocalEmiDatasource } from "@/feature/emiLoans/data/dataSource/local.emi.datasource.impl";
import { createEmiRepository } from "@/feature/emiLoans/data/repository/emi.repository.impl";
import { createGetEmiPlansUseCase } from "@/feature/emiLoans/useCase/getEmiPlans.useCase.impl";
import { createAddEmiPlanUseCase } from "@/feature/emiLoans/useCase/addEmiPlan.useCase.impl";
import { createGetEmiPlanByRemoteIdUseCase } from "@/feature/emiLoans/useCase/getEmiPlanByRemoteId.useCase.impl";
import { createPayEmiInstallmentUseCase } from "@/feature/emiLoans/useCase/payEmiInstallment.useCase.impl";
import { useEmiListViewModel } from "@/feature/emiLoans/viewModel/emiList.viewModel.impl";
import { useEmiPlanEditorViewModel } from "@/feature/emiLoans/viewModel/emiPlanEditor.viewModel.impl";
import { useEmiPlanDetailViewModel } from "@/feature/emiLoans/viewModel/emiPlanDetail.viewModel.impl";
import { EmiPlanMode } from "@/feature/emiLoans/types/emi.entity.types";
import { EmiLoansScreen } from "@/feature/emiLoans/ui/EmiLoansScreen";
import { createLocalTransactionDatasource } from "@/feature/transactions/data/dataSource/local.transaction.datasource.impl";
import { createTransactionRepository } from "@/feature/transactions/data/repository/transaction.repository.impl";
import { createLocalLedgerDatasource } from "@/feature/ledger/data/dataSource/local.ledger.datasource.impl";
import { createLedgerRepository } from "@/feature/ledger/data/repository/ledger.repository.impl";

export type GetEmiLoansScreenFactoryProps = {
  database: Database;
  activeAccountType: AccountTypeValue | null;
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
};

export function GetEmiLoansScreenFactory({
  database,
  activeAccountType,
  activeUserRemoteId,
  activeAccountRemoteId,
}: GetEmiLoansScreenFactoryProps) {
  const [reloadSignal, setReloadSignal] = useState(0);

  const accountDatasource = useMemo(() => createLocalAccountDatasource(database), [database]);
  const accountRepository = useMemo(
    () => createAccountRepository(accountDatasource),
    [accountDatasource],
  );
  const authUserDatasource = useMemo(() => createLocalAuthUserDatasource(database), [database]);
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

  const emiDatasource = useMemo(() => createLocalEmiDatasource(database), [database]);
  const emiRepository = useMemo(() => createEmiRepository(emiDatasource), [emiDatasource]);
  const getEmiPlansUseCase = useMemo(
    () => createGetEmiPlansUseCase(emiRepository),
    [emiRepository],
  );
  const addEmiPlanUseCase = useMemo(
    () => createAddEmiPlanUseCase(emiRepository),
    [emiRepository],
  );
  const getEmiPlanByRemoteIdUseCase = useMemo(
    () => createGetEmiPlanByRemoteIdUseCase(emiRepository),
    [emiRepository],
  );

  const transactionDatasource = useMemo(
    () => createLocalTransactionDatasource(database),
    [database],
  );
  const transactionRepository = useMemo(
    () => createTransactionRepository(transactionDatasource),
    [transactionDatasource],
  );
  const ledgerDatasource = useMemo(
    () => createLocalLedgerDatasource(database),
    [database],
  );
  const ledgerRepository = useMemo(
    () => createLedgerRepository(ledgerDatasource),
    [ledgerDatasource],
  );
  const payEmiInstallmentUseCase = useMemo(
    () =>
      createPayEmiInstallmentUseCase(
        emiRepository,
        transactionRepository,
        ledgerRepository,
      ),
    [emiRepository, ledgerRepository, transactionRepository],
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

      const filteredAccounts = result.value.filter((account) => {
        if (activeAccountType === AccountType.Business) {
          return account.accountType === AccountType.Business;
        }

        return account.accountType === AccountType.Personal;
      });

      setAccounts(filteredAccounts);
    };

    void loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [activeAccountType, activeUserRemoteId, getAccessibleAccountsByUserRemoteIdUseCase]);

  const activeAccount = useMemo(
    () => accounts.find((account) => account.remoteId === activeAccountRemoteId) ?? null,
    [accounts, activeAccountRemoteId],
  );

  const handleReload = useCallback(() => {
    setReloadSignal((currentSignal) => currentSignal + 1);
  }, []);

  const planMode =
    activeAccountType === AccountType.Business
      ? EmiPlanMode.Business
      : EmiPlanMode.Personal;

  const detailViewModel = useEmiPlanDetailViewModel(
    getEmiPlanByRemoteIdUseCase,
    payEmiInstallmentUseCase,
    handleReload,
  );

  const editorViewModel = useEmiPlanEditorViewModel({
    planMode,
    ownerUserRemoteId: activeUserRemoteId,
    businessAccountRemoteId:
      activeAccountType === AccountType.Business ? activeAccountRemoteId : null,
    linkedAccountRemoteId: activeAccountRemoteId,
    linkedAccountDisplayName:
      activeAccount?.displayName ?? "Active account",
    currencyCode: activeAccount?.currencyCode ?? "NPR",
    addEmiPlanUseCase,
    onSaved: handleReload,
  });

  const listViewModel = useEmiListViewModel({
    planMode,
    ownerUserRemoteId: activeUserRemoteId,
    businessAccountRemoteId:
      activeAccountType === AccountType.Business ? activeAccountRemoteId : null,
    getEmiPlansUseCase,
    getPlanDetailByRemoteId: getEmiPlanByRemoteIdUseCase.execute,
    onOpenCreate: editorViewModel.openCreate,
    onOpenDetail: detailViewModel.open,
    reloadSignal,
  });

  return (
    <EmiLoansScreen
      listViewModel={listViewModel}
      editorViewModel={editorViewModel}
      detailViewModel={detailViewModel}
    />
  );
}
