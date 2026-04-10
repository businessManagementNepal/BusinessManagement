import React from "react";
import { createLocalLedgerDatasource } from "@/feature/ledger/data/dataSource/local.ledger.datasource.impl";
import { createLedgerRepository } from "@/feature/ledger/data/repository/ledger.repository.impl";
import { createGetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase.impl";
import { NotificationCenterScreen } from "@/feature/notifications/ui/NotificationCenterScreen";
import { useNotificationCenterViewModel } from "@/feature/notifications/viewModel/notificationCenter.viewModel.impl";
import appDatabase from "@/shared/database/appDatabase";

type GetNotificationCenterScreenFactoryProps = {
  activeBusinessAccountRemoteId: string | null;
  activeBusinessAccountCurrencyCode: string | null;
  activeBusinessAccountCountryCode: string | null;
  onOpenLedger: () => void;
};

export function GetNotificationCenterScreenFactory({
  activeBusinessAccountRemoteId,
  activeBusinessAccountCurrencyCode,
  activeBusinessAccountCountryCode,
  onOpenLedger,
}: GetNotificationCenterScreenFactoryProps) {
  const ledgerDatasource = React.useMemo(
    () => createLocalLedgerDatasource(appDatabase),
    [],
  );
  const ledgerRepository = React.useMemo(
    () => createLedgerRepository(ledgerDatasource),
    [ledgerDatasource],
  );
  const getLedgerEntriesUseCase = React.useMemo(
    () => createGetLedgerEntriesUseCase(ledgerRepository),
    [ledgerRepository],
  );

  const viewModel = useNotificationCenterViewModel({
    businessAccountRemoteId: activeBusinessAccountRemoteId,
    businessAccountCurrencyCode: activeBusinessAccountCurrencyCode,
    businessAccountCountryCode: activeBusinessAccountCountryCode,
    getLedgerEntriesUseCase,
    onOpenLedger,
  });

  return <NotificationCenterScreen viewModel={viewModel} />;
}

