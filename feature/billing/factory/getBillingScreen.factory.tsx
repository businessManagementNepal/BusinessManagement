import { createLocalMoneyAccountDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccount.datasource.impl";
import { createMoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository.impl";
import { createGetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase.impl";
import { createLocalBillingDatasource } from "@/feature/billing/data/dataSource/local.billing.datasource.impl";
import { createBillingRepository } from "@/feature/billing/data/repository/billing.repository.impl";
import { createRunBillingSettlementUseCase } from "@/feature/billing/workflow/billingSettlement/useCase/runBillingSettlement.useCase.impl";
import { BillingScreen } from "@/feature/billing/ui/BillingScreen";
import { createDeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase.impl";
import { createDeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase } from "@/feature/billing/useCase/deleteBillingDocumentAllocationsBySettlementEntryRemoteId.useCase.impl";
import { createGetBillingDocumentByRemoteIdUseCase } from "@/feature/billing/useCase/getBillingDocumentByRemoteId.useCase.impl";
import { createGetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase.impl";
import { createLinkBillingDocumentContactUseCase } from "@/feature/billing/useCase/linkBillingDocumentContact.useCase.impl";
import { createLinkBillingDocumentLedgerEntryUseCase } from "@/feature/billing/useCase/linkBillingDocumentLedgerEntry.useCase.impl";
import { createPayBillingDocumentUseCase } from "@/feature/billing/useCase/payBillingDocument.useCase.impl";
import { createReplaceBillingDocumentAllocationsForSettlementEntryUseCase } from "@/feature/billing/useCase/replaceBillingDocumentAllocationsForSettlementEntry.useCase.impl";
import { createSaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase.impl";
import { createSaveBillPhotoUseCase } from "@/feature/billing/useCase/saveBillPhoto.useCase.impl";
import { useBillingViewModel } from "@/feature/billing/viewModel/billing.viewModel.impl";
import { createLocalContactDatasource } from "@/feature/contacts/data/dataSource/local.contact.datasource.impl";
import { createContactRepository } from "@/feature/contacts/data/repository/contact.repository.impl";
import { createGetOrCreateBusinessContactUseCase } from "@/feature/contacts/useCase/getOrCreateBusinessContact.useCase.impl";
import { createGetOrCreateContactUseCase } from "@/feature/contacts/useCase/getOrCreateContact.useCase.impl";
import { createLocalLedgerDatasource } from "@/feature/ledger/data/dataSource/local.ledger.datasource.impl";
import { createLedgerRepository } from "@/feature/ledger/data/repository/ledger.repository.impl";
import { createAddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase.impl";
import { createGetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase.impl";
import { createSaveLedgerEntryWithSettlementUseCase } from "@/feature/ledger/useCase/saveLedgerEntryWithSettlement.useCase.impl";
import { createUpdateLedgerEntryUseCase } from "@/feature/ledger/useCase/updateLedgerEntry.useCase.impl";
import { createDeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase.impl";
import { createPostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase.impl";
import { Database } from "@nozbe/watermelondb";
import React from "react";

import { TaxModeValue } from "@/shared/types/regionalFinance.types";

type Props = {
  activeUserRemoteId: string | null;
  database: Database;
  activeAccountRemoteId: string | null;
  activeAccountDisplayName: string;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  activeAccountDefaultTaxRatePercent: number | null;
  activeAccountDefaultTaxMode: TaxModeValue | null;
  canManage: boolean;
};

export function GetBillingScreenFactory({
  activeUserRemoteId,
  database,
  activeAccountRemoteId,
  activeAccountDisplayName,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  activeAccountDefaultTaxRatePercent,
  activeAccountDefaultTaxMode,
  canManage,
}: Props) {
  const datasource = React.useMemo(
    () => createLocalBillingDatasource(database),
    [database],
  );

  const repository = React.useMemo(
    () => createBillingRepository(datasource),
    [datasource],
  );

  const getBillingOverviewUseCase = React.useMemo(
    () => createGetBillingOverviewUseCase(repository),
    [repository],
  );

  const getBillingDocumentByRemoteIdUseCase = React.useMemo(
    () => createGetBillingDocumentByRemoteIdUseCase(repository),
    [repository],
  );

  const saveBillingDocumentUseCase = React.useMemo(
    () => createSaveBillingDocumentUseCase(repository),
    [repository],
  );

  const deleteBillingDocumentUseCase = React.useMemo(
    () => createDeleteBillingDocumentUseCase(repository),
    [repository],
  );
  const linkBillingDocumentContactUseCase = React.useMemo(
    () => createLinkBillingDocumentContactUseCase(repository),
    [repository],
  );

  const linkBillingDocumentLedgerEntryUseCase = React.useMemo(
    () => createLinkBillingDocumentLedgerEntryUseCase(repository),
    [repository],
  );

  const saveBillPhotoUseCase = React.useMemo(
    () => createSaveBillPhotoUseCase(repository),
    [repository],
  );

  const replaceBillingDocumentAllocationsForSettlementEntryUseCase =
    React.useMemo(
      () =>
        createReplaceBillingDocumentAllocationsForSettlementEntryUseCase(
          repository,
        ),
      [repository],
    );

  const deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase =
    React.useMemo(
      () =>
        createDeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase(
          repository,
        ),
      [repository],
    );

  const ledgerDatasource = React.useMemo(
    () => createLocalLedgerDatasource(database),
    [database],
  );

  const ledgerRepository = React.useMemo(
    () => createLedgerRepository(ledgerDatasource),
    [ledgerDatasource],
  );

  const getLedgerEntriesUseCase = React.useMemo(
    () => createGetLedgerEntriesUseCase(ledgerRepository),
    [ledgerRepository],
  );

  const addLedgerEntryUseCase = React.useMemo(
    () => createAddLedgerEntryUseCase(ledgerRepository),
    [ledgerRepository],
  );

  const updateLedgerEntryUseCase = React.useMemo(
    () => createUpdateLedgerEntryUseCase(ledgerRepository),
    [ledgerRepository],
  );

  const moneyAccountDatasource = React.useMemo(
    () => createLocalMoneyAccountDatasource(database),
    [database],
  );
  const moneyAccountRepository = React.useMemo(
    () => createMoneyAccountRepository(moneyAccountDatasource),
    [moneyAccountDatasource],
  );
  const getMoneyAccountsUseCase = React.useMemo(
    () => createGetMoneyAccountsUseCase(moneyAccountRepository),
    [moneyAccountRepository],
  );

  const contactDatasource = React.useMemo(
    () => createLocalContactDatasource(database),
    [database],
  );
  const contactRepository = React.useMemo(
    () => createContactRepository(contactDatasource),
    [contactDatasource],
  );
  const getOrCreateContactUseCase = React.useMemo(
    () => createGetOrCreateContactUseCase(contactRepository),
    [contactRepository],
  );
  const getOrCreateBusinessContactUseCase = React.useMemo(
    () => createGetOrCreateBusinessContactUseCase(getOrCreateContactUseCase),
    [getOrCreateContactUseCase],
  );

  const postBusinessTransactionUseCase = React.useMemo(
    () => createPostBusinessTransactionUseCase(database),
    [database],
  );
  const deleteBusinessTransactionUseCase = React.useMemo(
    () => createDeleteBusinessTransactionUseCase(database),
    [database],
  );

  const saveLedgerEntryWithSettlementUseCase = React.useMemo(
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
      }),
    [
      addLedgerEntryUseCase,
      updateLedgerEntryUseCase,
      getMoneyAccountsUseCase,
      postBusinessTransactionUseCase,
      deleteBusinessTransactionUseCase,
      saveBillingDocumentUseCase,
      replaceBillingDocumentAllocationsForSettlementEntryUseCase,
      deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
    ],
  );

  const runBillingSettlementUseCase = React.useMemo(
    () =>
      createRunBillingSettlementUseCase({
        getBillingDocumentByRemoteIdUseCase,
        linkBillingDocumentLedgerEntryUseCase,
        getLedgerEntriesUseCase,
        addLedgerEntryUseCase,
        saveLedgerEntryWithSettlementUseCase,
      }),
    [
      getBillingDocumentByRemoteIdUseCase,
      linkBillingDocumentLedgerEntryUseCase,
      getLedgerEntriesUseCase,
      addLedgerEntryUseCase,
      saveLedgerEntryWithSettlementUseCase,
    ],
  );

  const payBillingDocumentUseCase = React.useMemo(
    () => createPayBillingDocumentUseCase(runBillingSettlementUseCase),
    [runBillingSettlementUseCase],
  );

  const viewModel = useBillingViewModel({
    ownerUserRemoteId: activeUserRemoteId,
    accountRemoteId: activeAccountRemoteId,
    accountDisplayNameSnapshot: activeAccountDisplayName,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
    activeAccountDefaultTaxRatePercent,
    activeAccountDefaultTaxMode,
    canManage,
    getBillingOverviewUseCase,
    saveBillingDocumentUseCase,
    deleteBillingDocumentUseCase,
    linkBillingDocumentContactUseCase,
    saveBillPhotoUseCase,
    getOrCreateBusinessContactUseCase,
    getMoneyAccountsUseCase,
    payBillingDocumentUseCase,
  });

  return <BillingScreen viewModel={viewModel} />;
}
