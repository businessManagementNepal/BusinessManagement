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
import { createLocalLedgerDatasource } from "@/feature/ledger/data/dataSource/local.ledger.datasource.impl";
import { createLedgerRepository } from "@/feature/ledger/data/repository/ledger.repository.impl";
import { createGetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase.impl";
import { createGetLedgerEntryByRemoteIdUseCase } from "@/feature/ledger/useCase/getLedgerEntryByRemoteId.useCase.impl";
import { createAddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase.impl";
import { createUpdateLedgerEntryUseCase } from "@/feature/ledger/useCase/updateLedgerEntry.useCase.impl";
import { createDeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase.impl";
import { createGetLedgerEntriesByPartyUseCase } from "@/feature/ledger/useCase/getLedgerEntriesByParty.useCase.impl";
import { useLedgerListViewModel } from "@/feature/ledger/viewModel/ledgerList.viewModel.impl";
import { useLedgerEditorViewModel } from "@/feature/ledger/viewModel/ledgerEditor.viewModel.impl";
import { useLedgerDeleteViewModel } from "@/feature/ledger/viewModel/ledgerDelete.viewModel.impl";
import { useLedgerPartyDetailViewModel } from "@/feature/ledger/viewModel/ledgerPartyDetail.viewModel.impl";
import { LedgerScreen } from "@/feature/ledger/ui/LedgerScreen";

export type GetLedgerScreenFactoryProps = {
  database: Database;
  activeUserRemoteId: string | null;
  activeBusinessAccountRemoteId: string | null;
};

export function GetLedgerScreenFactory({
  database,
  activeUserRemoteId,
  activeBusinessAccountRemoteId,
}: GetLedgerScreenFactoryProps) {
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

  const ledgerDatasource = useMemo(
    () => createLocalLedgerDatasource(database),
    [database],
  );
  const ledgerRepository = useMemo(
    () => createLedgerRepository(ledgerDatasource),
    [ledgerDatasource],
  );
  const getLedgerEntriesUseCase = useMemo(
    () => createGetLedgerEntriesUseCase(ledgerRepository),
    [ledgerRepository],
  );
  const getLedgerEntryByRemoteIdUseCase = useMemo(
    () => createGetLedgerEntryByRemoteIdUseCase(ledgerRepository),
    [ledgerRepository],
  );
  const addLedgerEntryUseCase = useMemo(
    () => createAddLedgerEntryUseCase(ledgerRepository),
    [ledgerRepository],
  );
  const updateLedgerEntryUseCase = useMemo(
    () => createUpdateLedgerEntryUseCase(ledgerRepository),
    [ledgerRepository],
  );
  const deleteLedgerEntryUseCase = useMemo(
    () => createDeleteLedgerEntryUseCase(ledgerRepository),
    [ledgerRepository],
  );
  const getLedgerEntriesByPartyUseCase = useMemo(
    () => createGetLedgerEntriesByPartyUseCase(ledgerRepository),
    [ledgerRepository],
  );

  const [accounts, setAccounts] = React.useState<readonly Account[]>([]);

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
        result.value.filter((account) => account.accountType === AccountType.Business),
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

  const editorViewModel = useLedgerEditorViewModel({
    ownerUserRemoteId: activeUserRemoteId ?? "",
    activeBusinessAccountRemoteId,
    accounts,
    getLedgerEntryByRemoteIdUseCase,
    addLedgerEntryUseCase,
    updateLedgerEntryUseCase,
    onSaved: handleReload,
  });

  const deleteViewModel = useLedgerDeleteViewModel(
    deleteLedgerEntryUseCase,
    handleReload,
  );

  const partyDetailViewModel = useLedgerPartyDetailViewModel({
    businessAccountRemoteId: activeBusinessAccountRemoteId ?? "",
    getLedgerEntriesByPartyUseCase,
    onOpenEdit: editorViewModel.openEdit,
    onOpenDelete: deleteViewModel.openDelete,
    onOpenCreateForParty: editorViewModel.openCreateForParty,
  });

  const listViewModel = useLedgerListViewModel({
    businessAccountRemoteId: activeBusinessAccountRemoteId ?? "",
    getLedgerEntriesUseCase,
    onOpenCreate: editorViewModel.openCreate,
    onOpenPartyDetail: partyDetailViewModel.openPartyDetail,
    reloadSignal,
  });

  return (
    <LedgerScreen
      listViewModel={listViewModel}
      editorViewModel={editorViewModel}
      deleteViewModel={deleteViewModel}
      partyDetailViewModel={partyDetailViewModel}
    />
  );
}
