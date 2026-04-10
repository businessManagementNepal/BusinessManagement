import { createLocalMoneyAccountDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccount.datasource.impl";
import { createMoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository.impl";
import { createGetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase.impl";
import { createLocalAccountDatasource } from "@/feature/auth/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/auth/accountSelection/data/repository/account.repository.impl";
import { createLocalBillingDatasource } from "@/feature/billing/data/dataSource/local.billing.datasource.impl";
import { createBillingRepository } from "@/feature/billing/data/repository/billing.repository.impl";
import { createDeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase.impl";
import { createDeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase } from "@/feature/billing/useCase/deleteBillingDocumentAllocationsBySettlementEntryRemoteId.useCase.impl";
import { createReplaceBillingDocumentAllocationsForSettlementEntryUseCase } from "@/feature/billing/useCase/replaceBillingDocumentAllocationsForSettlementEntry.useCase.impl";
import { createSaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase.impl";
import {
  Account,
  AccountType,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import { createGetAccessibleAccountsByUserRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccessibleAccountsByUserRemoteId.useCase.impl";
import { createLocalContactDatasource } from "@/feature/contacts/data/dataSource/local.contact.datasource.impl";
import { createContactRepository } from "@/feature/contacts/data/repository/contact.repository.impl";
import { createGetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase.impl";
import { createSaveContactUseCase } from "@/feature/contacts/useCase/saveContact.useCase.impl";
import { createLocalLedgerDatasource } from "@/feature/ledger/data/dataSource/local.ledger.datasource.impl";
import { createLedgerRepository } from "@/feature/ledger/data/repository/ledger.repository.impl";
import { LedgerScreen } from "@/feature/ledger/ui/LedgerScreen";
import { createAddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase.impl";
import { createDeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase.impl";
import { createGetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase.impl";
import { createGetLedgerEntriesByPartyUseCase } from "@/feature/ledger/useCase/getLedgerEntriesByParty.useCase.impl";
import { createGetLedgerEntryByRemoteIdUseCase } from "@/feature/ledger/useCase/getLedgerEntryByRemoteId.useCase.impl";
import { createUpdateLedgerEntryUseCase } from "@/feature/ledger/useCase/updateLedgerEntry.useCase.impl";
import { useLedgerDeleteViewModel } from "@/feature/ledger/viewModel/ledgerDelete.viewModel.impl";
import { useLedgerEditorViewModel } from "@/feature/ledger/viewModel/ledgerEditor.viewModel.impl";
import { useLedgerListViewModel } from "@/feature/ledger/viewModel/ledgerList.viewModel.impl";
import { useLedgerPartyDetailViewModel } from "@/feature/ledger/viewModel/ledgerPartyDetail.viewModel.impl";
import { LedgerEntryType } from "@/feature/ledger/types/ledger.entity.types";
import { syncLedgerReminderNotifications } from "@/feature/ledger/reminder/ledgerReminder.scheduler";
import { createLocalAuthUserDatasource } from "@/feature/session/data/dataSource/local.authUser.datasource.impl";
import { createAuthUserRepository } from "@/feature/session/data/repository/authUser.repository.impl";
import { createDeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase.impl";
import { createPostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase.impl";
import { createLocalUserManagementDatasource } from "@/feature/userManagement/data/dataSource/local.userManagement.datasource.impl";
import { createUserManagementRepository } from "@/feature/userManagement/data/repository/userManagement.repository.impl";
import appDatabase from "@/shared/database/appDatabase";
import React, { useCallback, useMemo, useState } from "react";
import { resolveCurrencyCode } from "@/shared/utils/currency/accountCurrency";

export type GetLedgerScreenFactoryProps = {
  activeUserRemoteId: string | null;
  activeBusinessAccountRemoteId: string | null;
  activeBusinessAccountCurrencyCode: string | null;
  activeBusinessAccountCountryCode: string | null;
};

export function GetLedgerScreenFactory({
  activeUserRemoteId,
  activeBusinessAccountRemoteId,
  activeBusinessAccountCurrencyCode,
  activeBusinessAccountCountryCode,
}: GetLedgerScreenFactoryProps) {
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

  const ledgerDatasource = useMemo(
    () => createLocalLedgerDatasource(appDatabase),
    [],
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
  const contactDatasource = useMemo(
    () => createLocalContactDatasource(appDatabase),
    [],
  );
  const contactRepository = useMemo(
    () => createContactRepository(contactDatasource),
    [contactDatasource],
  );
  const getContactsUseCase = useMemo(
    () => createGetContactsUseCase(contactRepository),
    [contactRepository],
  );
  const saveContactUseCase = useMemo(
    () => createSaveContactUseCase(contactRepository),
    [contactRepository],
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
  const postBusinessTransactionUseCase = useMemo(
    () => createPostBusinessTransactionUseCase(appDatabase),
    [],
  );
  const deleteBusinessTransactionUseCase = useMemo(
    () => createDeleteBusinessTransactionUseCase(appDatabase),
    [],
  );
  const billingDatasource = useMemo(
    () => createLocalBillingDatasource(appDatabase),
    [],
  );
  const billingRepository = useMemo(
    () => createBillingRepository(billingDatasource),
    [billingDatasource],
  );
  const saveBillingDocumentUseCase = useMemo(
    () => createSaveBillingDocumentUseCase(billingRepository),
    [billingRepository],
  );
  const replaceBillingDocumentAllocationsForSettlementEntryUseCase = useMemo(
    () =>
      createReplaceBillingDocumentAllocationsForSettlementEntryUseCase(
        billingRepository,
      ),
    [billingRepository],
  );
  const deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase =
    useMemo(
      () =>
        createDeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase(
          billingRepository,
        ),
      [billingRepository],
    );
  const deleteBillingDocumentUseCase = useMemo(
    () => createDeleteBillingDocumentUseCase(billingRepository),
    [billingRepository],
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
          (account) => account.accountType === AccountType.Business,
        ),
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

  const syncLedgerReminders = useCallback(async () => {
    const businessAccountRemoteId = activeBusinessAccountRemoteId ?? "";
    if (!businessAccountRemoteId) {
      return;
    }

    const entriesResult = await getLedgerEntriesUseCase.execute({
      businessAccountRemoteId,
    });

    if (!entriesResult.success) {
      return;
    }

    await syncLedgerReminderNotifications(entriesResult.value);
  }, [activeBusinessAccountRemoteId, getLedgerEntriesUseCase]);

  const handleLedgerMutation = useCallback(() => {
    handleReload();
    void syncLedgerReminders();
  }, [handleReload, syncLedgerReminders]);

  React.useEffect(() => {
    void syncLedgerReminders();
  }, [syncLedgerReminders]);
  const activeBusinessAccount = useMemo(
    () =>
      accounts.find(
        (account) => account.remoteId === activeBusinessAccountRemoteId,
      ) ?? null,
    [accounts, activeBusinessAccountRemoteId],
  );
  const resolvedBusinessCurrencyCode = useMemo(
    () =>
      resolveCurrencyCode({
        currencyCode:
          activeBusinessAccount?.currencyCode ?? activeBusinessAccountCurrencyCode,
        countryCode: activeBusinessAccountCountryCode,
      }),
    [
      activeBusinessAccount?.currencyCode,
      activeBusinessAccountCountryCode,
      activeBusinessAccountCurrencyCode,
    ],
  );

  const editorViewModel = useLedgerEditorViewModel({
    ownerUserRemoteId: activeUserRemoteId ?? "",
    activeBusinessAccountRemoteId,
    activeBusinessAccountDisplayName:
      activeBusinessAccount?.displayName ?? "Business Account",
    activeBusinessCurrencyCode: resolvedBusinessCurrencyCode,
    getLedgerEntriesUseCase,
    getLedgerEntryByRemoteIdUseCase,
    addLedgerEntryUseCase,
    updateLedgerEntryUseCase,
    getContactsUseCase,
    saveContactUseCase,
    getMoneyAccountsUseCase,
    postBusinessTransactionUseCase,
    deleteBusinessTransactionUseCase,
    saveBillingDocumentUseCase,
    replaceBillingDocumentAllocationsForSettlementEntryUseCase,
    deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
    onSaved: handleLedgerMutation,
  });

  const deleteViewModel = useLedgerDeleteViewModel({
    deleteLedgerEntryUseCase,
    getLedgerEntryByRemoteIdUseCase,
    deleteBusinessTransactionUseCase,
    deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
    deleteBillingDocumentUseCase,
    onDeleted: handleLedgerMutation,
  });

  const partyDetailViewModel = useLedgerPartyDetailViewModel({
    businessAccountRemoteId: activeBusinessAccountRemoteId ?? "",
    getLedgerEntriesByPartyUseCase,
    onOpenEdit: editorViewModel.openEdit,
    onOpenDelete: deleteViewModel.openDelete,
    onOpenCreateForParty: editorViewModel.openCreateForParty,
  });

  const listViewModel = useLedgerListViewModel({
    businessAccountRemoteId: activeBusinessAccountRemoteId ?? "",
    businessAccountCurrencyCode: resolvedBusinessCurrencyCode,
    businessAccountCountryCode: activeBusinessAccountCountryCode,
    getLedgerEntriesUseCase,
    onOpenCreate: editorViewModel.openCreate,
    onQuickCollectForParty: (partyName: string) =>
      editorViewModel.openCreateForParty(partyName, LedgerEntryType.Collection),
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
