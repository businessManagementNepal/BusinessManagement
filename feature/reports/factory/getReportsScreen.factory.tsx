import React from "react";
import { Database } from "@nozbe/watermelondb";
import { createLocalReportsDatasource } from "@/feature/reports/data/dataSource/local.reports.datasource.impl";
import { createReportsRepository } from "@/feature/reports/data/repository/reports.repository.impl";
import { createReportDetailDocumentAdapter } from "@/feature/reports/adapter/reportDetailDocument.adapter.impl";
import { createExportReportDetailDocumentUseCase } from "@/feature/reports/useCase/exportReportDetailDocument.useCase.impl";
import { createGetReportsDashboardUseCase } from "@/feature/reports/useCase/getReportsDashboard.useCase.impl";
import { createGetReportDetailUseCase } from "@/feature/reports/useCase/getReportDetail.useCase.impl";
import { useReportsViewModel } from "@/feature/reports/viewModel/reports.viewModel.impl";
import { ReportsScreen } from "@/feature/reports/ui/ReportsScreen";
import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";

type Props = {
  database: Database;
  accountType: AccountTypeValue;
  ownerUserRemoteId: string | null;
  accountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  canExportReports: boolean;
};

export function GetReportsScreenFactory({
  database,
  accountType,
  ownerUserRemoteId,
  accountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  canExportReports,
}: Props) {
  const datasource = React.useMemo(() => createLocalReportsDatasource(database), [database]);
  const repository = React.useMemo(
    () =>
      createReportsRepository(datasource, {
        currencyCode: activeAccountCurrencyCode,
        countryCode: activeAccountCountryCode,
      }),
    [activeAccountCountryCode, activeAccountCurrencyCode, datasource],
  );
  const getReportsDashboardUseCase = React.useMemo(
    () => createGetReportsDashboardUseCase(repository),
    [repository],
  );
  const getReportDetailUseCase = React.useMemo(
    () => createGetReportDetailUseCase(repository),
    [repository],
  );

  const reportDetailDocumentAdapter = React.useMemo(
    () => createReportDetailDocumentAdapter(),
    [],
  );

  const exportReportDetailDocumentUseCase = React.useMemo(
    () => createExportReportDetailDocumentUseCase(reportDetailDocumentAdapter),
    [reportDetailDocumentAdapter],
  );

  const viewModel = useReportsViewModel({
    accountType,
    ownerUserRemoteId,
    accountRemoteId,
    canExportReports,
    getReportsDashboardUseCase,
    getReportDetailUseCase,
    exportReportDetailDocumentUseCase,
  });

  return <ReportsScreen viewModel={viewModel} />;
}
