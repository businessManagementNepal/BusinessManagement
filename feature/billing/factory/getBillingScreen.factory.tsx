import React from "react";
import { Database } from "@nozbe/watermelondb";
import { createLocalMoneyAccountDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccount.datasource.impl";
import { createMoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository.impl";
import { createGetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase.impl";
import { createLocalBillingDatasource } from "@/feature/billing/data/dataSource/local.billing.datasource.impl";
import { createBillingRepository } from "@/feature/billing/data/repository/billing.repository.impl";
import { createGetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase.impl";
import { createSaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase.impl";
import { createSaveBillingDocumentAllocationsUseCase } from "@/feature/billing/useCase/saveBillingDocumentAllocations.useCase.impl";
import { createDeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase.impl";
import { createSaveBillPhotoUseCase } from "@/feature/billing/useCase/saveBillPhoto.useCase.impl";
import { createDeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase.impl";
import { createPostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase.impl";
import { useBillingViewModel } from "@/feature/billing/viewModel/billing.viewModel.impl";
import { BillingScreen } from "@/feature/billing/ui/BillingScreen";

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

  const saveBillingDocumentUseCase = React.useMemo(
    () => createSaveBillingDocumentUseCase(repository),
    [repository],
  );

  const deleteBillingDocumentUseCase = React.useMemo(
    () => createDeleteBillingDocumentUseCase(repository),
    [repository],
  );

  const saveBillPhotoUseCase = React.useMemo(
    () => createSaveBillPhotoUseCase(repository),
    [repository],
  );
  const saveBillingDocumentAllocationsUseCase = React.useMemo(
    () => createSaveBillingDocumentAllocationsUseCase(repository),
    [repository],
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

  const postBusinessTransactionUseCase = React.useMemo(
    () => createPostBusinessTransactionUseCase(database),
    [database],
  );
  const deleteBusinessTransactionUseCase = React.useMemo(
    () => createDeleteBusinessTransactionUseCase(database),
    [database],
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
    saveBillingDocumentAllocationsUseCase,
    deleteBillingDocumentUseCase,
    saveBillPhotoUseCase,
    getMoneyAccountsUseCase,
    postBusinessTransactionUseCase,
    deleteBusinessTransactionUseCase,
  });

  return <BillingScreen viewModel={viewModel} />;
}
