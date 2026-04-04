import React from "react";
import { Database } from "@nozbe/watermelondb";
import { createLocalBillingDatasource } from "@/feature/billing/data/dataSource/local.billing.datasource.impl";
import { createBillingRepository } from "@/feature/billing/data/repository/billing.repository.impl";
import { createGetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase.impl";
import { createSaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase.impl";
import { createDeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase.impl";
import { createSaveBillPhotoUseCase } from "@/feature/billing/useCase/saveBillPhoto.useCase.impl";
import { useBillingViewModel } from "@/feature/billing/viewModel/billing.viewModel.impl";
import { BillingScreen } from "@/feature/billing/ui/BillingScreen";

type Props = {
  database: Database;
  activeAccountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  canManage: boolean;
};

export function GetBillingScreenFactory({
  database,
  activeAccountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
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

  const viewModel = useBillingViewModel({
    accountRemoteId: activeAccountRemoteId,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
    canManage,
    getBillingOverviewUseCase,
    saveBillingDocumentUseCase,
    deleteBillingDocumentUseCase,
    saveBillPhotoUseCase,
  });

  return <BillingScreen viewModel={viewModel} />;
}
