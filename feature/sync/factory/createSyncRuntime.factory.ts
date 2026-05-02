import { createLocalAuditDatasource } from "@/feature/audit/data/dataSource/local.audit.datasource.impl";
import { createAuditRepository } from "@/feature/audit/data/repository/audit.repository.impl";
import { createRecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase.impl";
import { createLocalMoneyAccountProjectionDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccountProjection.datasource.impl";
import { createRecalculateMoneyAccountBalancesUseCase } from "@/feature/accounts/useCase/recalculateMoneyAccountBalances.useCase.impl";
import { createLocalStockProjectionDatasource } from "@/feature/inventory/data/dataSource/local.stockProjection.datasource.impl";
import { createRecalculateStockProjectionUseCase } from "@/feature/inventory/useCase/recalculateStockProjection.useCase.impl";
import { syncLock } from "@/shared/sync/runtime/syncLock";
import { Database } from "@nozbe/watermelondb";
import { createLocalSyncLocalDatasource } from "../data/dataSource/local.syncLocal.datasource.impl";
import { createLocalSyncFeatureFlagDatasource } from "../data/dataSource/local.syncFeatureFlag.datasource.impl";
import type { SyncRemoteDatasource } from "../data/dataSource/syncRemote.datasource";
import { createSyncRepository } from "../data/repository/sync.repository.impl";
import { createSyncFeatureFlagRepository } from "../data/repository/syncFeatureFlag.repository.impl";
import type { GetSyncStatusUseCase } from "../useCase/getSyncStatus.useCase";
import type { GetSyncFeatureFlagUseCase } from "../useCase/getSyncFeatureFlag.useCase";
import { createGetSyncFeatureFlagUseCase } from "../useCase/getSyncFeatureFlag.useCase.impl";
import { createGetSyncStatusUseCase } from "../useCase/getSyncStatus.useCase.impl";
import type { ApplyPulledChangesUseCase } from "../useCase/applyPulledChanges.useCase";
import { createApplyPulledChangesUseCase } from "../useCase/applyPulledChanges.useCase.impl";
import type { PullRemoteChangesUseCase } from "../useCase/pullRemoteChanges.useCase";
import { createPullRemoteChangesUseCase } from "../useCase/pullRemoteChanges.useCase.impl";
import type { PushPendingChangesUseCase } from "../useCase/pushPendingChanges.useCase";
import { createPushPendingChangesUseCase } from "../useCase/pushPendingChanges.useCase.impl";
import type { ResolveSyncConflictUseCase } from "../useCase/resolveSyncConflict.useCase";
import { createResolveSyncConflictUseCase } from "../useCase/resolveSyncConflict.useCase.impl";
import { createSyncRunRepository } from "../workflow/syncRun/repository/syncRun.repository.impl";
import type { RunSyncWorkflowUseCase } from "../workflow/syncRun/useCase/runSyncWorkflow.useCase";
import { createRunSyncWorkflowUseCase } from "../workflow/syncRun/useCase/runSyncWorkflow.useCase.impl";

export type SyncRuntime = {
  getSyncFeatureFlagUseCase: GetSyncFeatureFlagUseCase;
  getSyncStatusUseCase: GetSyncStatusUseCase;
  pushPendingChangesUseCase: PushPendingChangesUseCase;
  pullRemoteChangesUseCase: PullRemoteChangesUseCase;
  applyPulledChangesUseCase: ApplyPulledChangesUseCase;
  resolveSyncConflictUseCase: ResolveSyncConflictUseCase;
  runSyncWorkflowUseCase: RunSyncWorkflowUseCase;
};

export type CreateSyncRuntime = (
  database: Database,
  remoteDatasource: SyncRemoteDatasource,
) => SyncRuntime;

export const createSyncRuntime: CreateSyncRuntime = (
  database,
  remoteDatasource,
) => {
  const localDatasource = createLocalSyncLocalDatasource(database);
  const syncRepository = createSyncRepository(localDatasource, remoteDatasource);
  const syncFeatureFlagDatasource = createLocalSyncFeatureFlagDatasource(database);
  const syncFeatureFlagRepository =
    createSyncFeatureFlagRepository(syncFeatureFlagDatasource);

  const getSyncFeatureFlagUseCase =
    createGetSyncFeatureFlagUseCase(syncFeatureFlagRepository);
  const getSyncStatusUseCase = createGetSyncStatusUseCase(syncRepository);
  const pushPendingChangesUseCase =
    createPushPendingChangesUseCase(syncRepository);
  const pullRemoteChangesUseCase =
    createPullRemoteChangesUseCase(syncRepository);
  const applyPulledChangesUseCase =
    createApplyPulledChangesUseCase(syncRepository);
  const resolveSyncConflictUseCase =
    createResolveSyncConflictUseCase(syncRepository);

  const auditDatasource = createLocalAuditDatasource(database);
  const auditRepository = createAuditRepository(auditDatasource);
  const recordAuditEventUseCase = createRecordAuditEventUseCase(auditRepository);

  const moneyAccountProjectionDatasource =
    createLocalMoneyAccountProjectionDatasource(database);
  const recalculateMoneyAccountBalancesUseCase =
    createRecalculateMoneyAccountBalancesUseCase(
      moneyAccountProjectionDatasource,
    );

  const stockProjectionDatasource =
    createLocalStockProjectionDatasource(database);
  const recalculateStockProjectionUseCase =
    createRecalculateStockProjectionUseCase(stockProjectionDatasource);

  const syncRunRepository = createSyncRunRepository({
    syncRepository,
    pushPendingChangesUseCase,
    pullRemoteChangesUseCase,
    applyPulledChangesUseCase,
    recalculateMoneyAccountBalancesUseCase,
    recalculateStockProjectionUseCase,
    recordAuditEventUseCase,
  });

  const runSyncWorkflowUseCase = createRunSyncWorkflowUseCase({
    syncRunRepository,
    syncLock,
    getSyncFeatureFlagUseCase,
  });

  return {
    getSyncFeatureFlagUseCase,
    getSyncStatusUseCase,
    pushPendingChangesUseCase,
    pullRemoteChangesUseCase,
    applyPulledChangesUseCase,
    resolveSyncConflictUseCase,
    runSyncWorkflowUseCase,
  };
};
