import { createLocalMoneyAccountDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccount.datasource.impl";
import { createMoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository.impl";
import { createLocalAuditDatasource } from "@/feature/audit/data/dataSource/local.audit.datasource.impl";
import { createAuditRepository } from "@/feature/audit/data/repository/audit.repository.impl";
import { createRecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase.impl";
import { MoneyAccountsScreen } from "@/feature/accounts/ui/MoneyAccountsScreen";
import { createAdjustMoneyAccountBalanceUseCase } from "@/feature/accounts/useCase/adjustMoneyAccountBalance.useCase.impl";
import { createArchiveMoneyAccountUseCase } from "@/feature/accounts/useCase/archiveMoneyAccount.useCase.impl";
import { createGetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase.impl";
import { createSaveMoneyAccountUseCase } from "@/feature/accounts/useCase/saveMoneyAccount.useCase.impl";
import { useMoneyAccountsViewModel } from "@/feature/accounts/viewModel/moneyAccounts.viewModel.impl";
import { createRunMoneyAccountBalanceReconciliationWorkflowUseCase } from "@/feature/accounts/workflow/moneyAccountBalanceReconciliation/useCase/runMoneyAccountBalanceReconciliation.useCase.impl";
import { createRunMoneyAccountOpeningBalanceWorkflowUseCase } from "@/feature/accounts/workflow/moneyAccountOpeningBalance/useCase/runMoneyAccountOpeningBalance.useCase.impl";
import { createLocalMoneyAccountBalanceDatasource } from "@/feature/transactions/data/dataSource/local.moneyAccountBalance.datasource.impl";
import { createLocalMoneyPostingDatasource } from "@/feature/transactions/data/dataSource/local.moneyPosting.datasource.impl";
import { createMoneyPostingRepository } from "@/feature/transactions/data/repository/moneyPosting.repository.impl";
import { createMoneyPostingWorkflowRepository } from "@/feature/transactions/workflow/moneyPosting/repository/moneyPostingWorkflow.repository.impl";
import { createRunMoneyPostingWorkflowUseCase } from "@/feature/transactions/workflow/moneyPosting/useCase/runMoneyPostingWorkflow.useCase.impl";
import { createPostMoneyMovementUseCase } from "@/feature/transactions/useCase/postMoneyMovement.useCase.impl";
import appDatabase from "@/shared/database/appDatabase";
import React from "react";

type GetMoneyAccountsScreenFactoryProps = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountDisplayName: string;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  canManage: boolean;
  onOpenAccountHistory: (
    moneyAccountRemoteId: string,
    moneyAccountName: string,
  ) => void;
};

export function GetMoneyAccountsScreenFactory({
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountDisplayName,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  canManage,
  onOpenAccountHistory,
}: GetMoneyAccountsScreenFactoryProps): React.ReactElement {
  const datasource = React.useMemo(
    () => createLocalMoneyAccountDatasource(appDatabase),
    [],
  );

  const repository = React.useMemo(
    () => createMoneyAccountRepository(datasource),
    [datasource],
  );

  const getMoneyAccountsUseCase = React.useMemo(
    () => createGetMoneyAccountsUseCase(repository),
    [repository],
  );

  const moneyPostingTransactionDatasource = React.useMemo(
    () => createLocalMoneyPostingDatasource(appDatabase),
    [],
  );
  const moneyAccountBalanceDatasource = React.useMemo(
    () => createLocalMoneyAccountBalanceDatasource(appDatabase),
    [],
  );
  const moneyPostingWorkflowRepository = React.useMemo(
    () =>
      createMoneyPostingWorkflowRepository({
        transactionDatasource: moneyPostingTransactionDatasource,
        moneyAccountBalanceDatasource,
      }),
    [moneyAccountBalanceDatasource, moneyPostingTransactionDatasource],
  );
  const auditDatasource = React.useMemo(
    () => createLocalAuditDatasource(appDatabase),
    [],
  );
  const auditRepository = React.useMemo(
    () => createAuditRepository(auditDatasource),
    [auditDatasource],
  );
  const recordAuditEventUseCase = React.useMemo(
    () => createRecordAuditEventUseCase(auditRepository),
    [auditRepository],
  );
  const runMoneyPostingWorkflowUseCase = React.useMemo(
    () =>
      createRunMoneyPostingWorkflowUseCase({
        workflowRepository: moneyPostingWorkflowRepository,
        recordAuditEventUseCase,
      }),
    [moneyPostingWorkflowRepository, recordAuditEventUseCase],
  );
  const moneyPostingRepositoryAdapter = React.useMemo(
    () => createMoneyPostingRepository(runMoneyPostingWorkflowUseCase),
    [runMoneyPostingWorkflowUseCase],
  );
  const postMoneyMovementUseCase = React.useMemo(
    () => createPostMoneyMovementUseCase(moneyPostingRepositoryAdapter),
    [moneyPostingRepositoryAdapter],
  );

  const runMoneyAccountOpeningBalanceWorkflowUseCase = React.useMemo(
    () =>
      createRunMoneyAccountOpeningBalanceWorkflowUseCase({
        moneyAccountRepository: repository,
        postMoneyMovementUseCase,
      }),
    [postMoneyMovementUseCase, repository],
  );

  const saveMoneyAccountUseCase = React.useMemo(
    () =>
      createSaveMoneyAccountUseCase({
        repository,
        runMoneyAccountOpeningBalanceWorkflowUseCase,
      }),
    [repository, runMoneyAccountOpeningBalanceWorkflowUseCase],
  );

  const archiveMoneyAccountUseCase = React.useMemo(
    () => createArchiveMoneyAccountUseCase(repository),
    [repository],
  );

  const runMoneyAccountBalanceReconciliationWorkflowUseCase = React.useMemo(
    () =>
      createRunMoneyAccountBalanceReconciliationWorkflowUseCase({
        moneyAccountRepository: repository,
        postMoneyMovementUseCase,
      }),
    [postMoneyMovementUseCase, repository],
  );

  const adjustMoneyAccountBalanceUseCase = React.useMemo(
    () =>
      createAdjustMoneyAccountBalanceUseCase({
        runMoneyAccountBalanceReconciliationWorkflowUseCase,
      }),
    [runMoneyAccountBalanceReconciliationWorkflowUseCase],
  );

  const viewModel = useMoneyAccountsViewModel({
    activeUserRemoteId,
    scopeAccountRemoteId: activeAccountRemoteId,
    scopeAccountDisplayName: activeAccountDisplayName,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
    canManage,
    getMoneyAccountsUseCase,
    saveMoneyAccountUseCase,
    archiveMoneyAccountUseCase,
    adjustMoneyAccountBalanceUseCase,
    onOpenAccountHistory,
  });

  return <MoneyAccountsScreen viewModel={viewModel} />;
}
