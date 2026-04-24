import { createLocalMoneyAccountDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccount.datasource.impl";
import { createMoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository.impl";
import { createGetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase.impl";
import { createLocalAuditDatasource } from "@/feature/audit/data/dataSource/local.audit.datasource.impl";
import { createAuditRepository } from "@/feature/audit/data/repository/audit.repository.impl";
import { createRecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase.impl";
import { createLocalAccountDatasource } from "@/feature/auth/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/auth/accountSelection/data/repository/account.repository.impl";
import {
    Account,
    AccountType,
    AccountTypeValue,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import { createGetAccessibleAccountsByUserRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccessibleAccountsByUserRemoteId.useCase.impl";
import { createLocalEmiDatasource } from "@/feature/emiLoans/data/dataSource/local.emi.datasource.impl";
import { createEmiRepository } from "@/feature/emiLoans/data/repository/emi.repository.impl";
import { EmiPlanMode } from "@/feature/emiLoans/types/emi.entity.types";
import { EmiLoansScreen } from "@/feature/emiLoans/ui/EmiLoansScreen";
import { createAddEmiPlanUseCase } from "@/feature/emiLoans/useCase/addEmiPlan.useCase.impl";
import { createGetEmiPlanByRemoteIdUseCase } from "@/feature/emiLoans/useCase/getEmiPlanByRemoteId.useCase.impl";
import { createGetEmiPlansUseCase } from "@/feature/emiLoans/useCase/getEmiPlans.useCase.impl";
import { createPayEmiInstallmentUseCase } from "@/feature/emiLoans/useCase/payEmiInstallment.useCase.impl";
import { useEmiListViewModel } from "@/feature/emiLoans/viewModel/emiList.viewModel.impl";
import { useEmiPlanDetailViewModel } from "@/feature/emiLoans/viewModel/emiPlanDetail.viewModel.impl";
import { useEmiPlanEditorViewModel } from "@/feature/emiLoans/viewModel/emiPlanEditor.viewModel.impl";
import { createLocalBillingDatasource } from "@/feature/billing/data/dataSource/local.billing.datasource.impl";
import { createBillingRepository } from "@/feature/billing/data/repository/billing.repository.impl";
import { createDeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase.impl";
import { createDeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase } from "@/feature/billing/useCase/deleteBillingDocumentAllocationsBySettlementEntryRemoteId.useCase.impl";
import { createReplaceBillingDocumentAllocationsForSettlementEntryUseCase } from "@/feature/billing/useCase/replaceBillingDocumentAllocationsForSettlementEntry.useCase.impl";
import { createSaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase.impl";
import { createLocalLedgerDatasource } from "@/feature/ledger/data/dataSource/local.ledger.datasource.impl";
import { createLedgerRepository } from "@/feature/ledger/data/repository/ledger.repository.impl";
import { createAddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase.impl";
import { createDeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase.impl";
import { createGetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase.impl";
import { createSaveLedgerEntryWithSettlementUseCase } from "@/feature/ledger/useCase/saveLedgerEntryWithSettlement.useCase.impl";
import { createUpdateLedgerEntryUseCase } from "@/feature/ledger/useCase/updateLedgerEntry.useCase.impl";
import { createLocalAuthUserDatasource } from "@/feature/session/data/dataSource/local.authUser.datasource.impl";
import { createAuthUserRepository } from "@/feature/session/data/repository/authUser.repository.impl";
import { createLocalUserManagementDatasource } from "@/feature/userManagement/data/dataSource/local.userManagement.datasource.impl";
import { createUserManagementRepository } from "@/feature/userManagement/data/repository/userManagement.repository.impl";
import { createMoneyPostingRuntime } from "@/feature/transactions/factory/createMoneyPostingRuntime.factory";
import appDatabase from "@/shared/database/appDatabase";
import React, { useCallback, useMemo, useState } from "react";
import { resolveCurrencyCode } from "@/shared/utils/currency/accountCurrency";

export type GetEmiLoansScreenFactoryProps = {
  activeAccountType: AccountTypeValue | null;
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
};

export function GetEmiLoansScreenFactory({
  activeAccountType,
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
}: GetEmiLoansScreenFactoryProps) {
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

  const emiDatasource = useMemo(
    () => createLocalEmiDatasource(appDatabase),
    [],
  );
  const emiRepository = useMemo(
    () => createEmiRepository(emiDatasource),
    [emiDatasource],
  );
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
  const auditDatasource = useMemo(
    () => createLocalAuditDatasource(appDatabase),
    [],
  );
  const auditRepository = useMemo(
    () => createAuditRepository(auditDatasource),
    [auditDatasource],
  );
  const recordAuditEventUseCase = useMemo(
    () => createRecordAuditEventUseCase(auditRepository),
    [auditRepository],
  );
  const moneyPostingRuntime = useMemo(
    () => createMoneyPostingRuntime(appDatabase),
    [],
  );
  const { postBusinessTransactionUseCase, deleteBusinessTransactionUseCase } =
    moneyPostingRuntime;
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
  const saveLedgerEntryWithSettlementUseCase = useMemo(
    () =>
      createSaveLedgerEntryWithSettlementUseCase({
        addLedgerEntryUseCase,
        updateLedgerEntryUseCase,
        getMoneyAccountsUseCase,
        postBusinessTransactionUseCase,
        deleteBusinessTransactionUseCase,
        saveBillingDocumentUseCase,
        replaceBillingDocumentAllocationsForSettlementEntryUseCase,
        deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
        deleteBillingDocumentUseCase,
        recordAuditEventUseCase,
      }),
    [
      addLedgerEntryUseCase,
      deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
      deleteBillingDocumentUseCase,
      deleteBusinessTransactionUseCase,
      getMoneyAccountsUseCase,
      postBusinessTransactionUseCase,
      recordAuditEventUseCase,
      replaceBillingDocumentAllocationsForSettlementEntryUseCase,
      saveBillingDocumentUseCase,
      updateLedgerEntryUseCase,
    ],
  );
  const payEmiInstallmentUseCase = useMemo(
    () =>
      createPayEmiInstallmentUseCase(
        emiRepository,
        getMoneyAccountsUseCase,
        postBusinessTransactionUseCase,
        deleteBusinessTransactionUseCase,
        getLedgerEntriesUseCase,
        saveLedgerEntryWithSettlementUseCase,
        deleteLedgerEntryUseCase,
        deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
      ),
    [
      deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
      deleteBusinessTransactionUseCase,
      deleteLedgerEntryUseCase,
      emiRepository,
      getLedgerEntriesUseCase,
      getMoneyAccountsUseCase,
      postBusinessTransactionUseCase,
      saveLedgerEntryWithSettlementUseCase,
    ],
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
  }, [
    activeAccountType,
    activeUserRemoteId,
    getAccessibleAccountsByUserRemoteIdUseCase,
  ]);

  const activeAccount = useMemo(
    () =>
      accounts.find((account) => account.remoteId === activeAccountRemoteId) ??
      null,
    [accounts, activeAccountRemoteId],
  );
  const resolvedCurrencyCode = useMemo(
    () =>
      resolveCurrencyCode({
        currencyCode: activeAccount?.currencyCode ?? activeAccountCurrencyCode,
        countryCode: activeAccountCountryCode,
      }),
    [
      activeAccount?.currencyCode,
      activeAccountCountryCode,
      activeAccountCurrencyCode,
    ],
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
    getMoneyAccountsUseCase,
    payEmiInstallmentUseCase,
    handleReload,
  );

  const editorViewModel = useEmiPlanEditorViewModel({
    planMode,
    ownerUserRemoteId: activeUserRemoteId,
    businessAccountRemoteId:
      activeAccountType === AccountType.Business ? activeAccountRemoteId : null,
    linkedAccountRemoteId: activeAccountRemoteId,
    linkedAccountDisplayName: activeAccount?.displayName ?? "Active account",
    currencyCode: resolvedCurrencyCode,
    addEmiPlanUseCase,
    onSaved: handleReload,
  });

  const listViewModel = useEmiListViewModel({
    planMode,
    ownerUserRemoteId: activeUserRemoteId,
    businessAccountRemoteId:
      activeAccountType === AccountType.Business ? activeAccountRemoteId : null,
    fallbackCurrencyCode: resolvedCurrencyCode,
    fallbackCountryCode: activeAccountCountryCode,
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
