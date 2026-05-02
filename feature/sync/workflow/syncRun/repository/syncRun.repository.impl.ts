import {
  AuditModule,
  AuditOutcome,
  AuditSeverity,
} from "@/feature/audit/types/audit.entity.types";
import { RecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase";
import { RecalculateMoneyAccountBalancesUseCase } from "@/feature/accounts/useCase/recalculateMoneyAccountBalances.useCase";
import { RecalculateStockProjectionUseCase } from "@/feature/inventory/useCase/recalculateStockProjection.useCase";
import { SyncRepository } from "@/feature/sync/data/repository/sync.repository";
import { SyncRunRepository } from "./syncRun.repository";

type CreateSyncRunRepositoryParams = {
  syncRepository: SyncRepository;
  pushPendingChangesUseCase: import("@/feature/sync/useCase/pushPendingChanges.useCase").PushPendingChangesUseCase;
  pullRemoteChangesUseCase: import("@/feature/sync/useCase/pullRemoteChanges.useCase").PullRemoteChangesUseCase;
  applyPulledChangesUseCase: import("@/feature/sync/useCase/applyPulledChanges.useCase").ApplyPulledChangesUseCase;
  recalculateMoneyAccountBalancesUseCase: RecalculateMoneyAccountBalancesUseCase;
  recalculateStockProjectionUseCase: RecalculateStockProjectionUseCase;
  recordAuditEventUseCase?: RecordAuditEventUseCase;
};

export const createSyncRunRepository = ({
  syncRepository,
  pushPendingChangesUseCase,
  pullRemoteChangesUseCase,
  applyPulledChangesUseCase,
  recalculateMoneyAccountBalancesUseCase,
  recalculateStockProjectionUseCase,
  recordAuditEventUseCase,
}: CreateSyncRunRepositoryParams): SyncRunRepository => ({
  createRun(input, startedAt) {
    return syncRepository.createSyncRun(input, startedAt);
  },

  pushPendingChanges(input, syncRunRemoteId) {
    return pushPendingChangesUseCase.execute({
      ...input,
      syncRunRemoteId,
    });
  },

  pullRemoteChanges(input) {
    return pullRemoteChangesUseCase.execute(input);
  },

  applyPulledChanges(input, response) {
    return applyPulledChangesUseCase.execute(input, response);
  },

  async rebuildProjections(input, applySummary) {
    if (applySummary.touchedMoneyAccountProjection) {
      const result = await recalculateMoneyAccountBalancesUseCase.execute({
        accountRemoteId: input.accountRemoteId,
      });
      if (!result.success) {
        return result;
      }
    }

    if (applySummary.touchedInventoryProjection) {
      const result = await recalculateStockProjectionUseCase.execute({
        accountRemoteId: input.accountRemoteId,
      });
      if (!result.success) {
        return result;
      }
    }

    return {
      success: true,
      value: true,
    };
  },

  saveCheckpoints(input, applySummary, lastPulledAt) {
    return syncRepository.saveCheckpoints(
      input,
      applySummary.checkpointUpdates,
      lastPulledAt,
    );
  },

  completeRun(syncRunRemoteId, counts, finishedAt) {
    return syncRepository.completeSyncRun(syncRunRemoteId, counts, finishedAt);
  },

  failRun(syncRunRemoteId, counts, finishedAt, errorMessage) {
    return syncRepository.failSyncRun(
      syncRunRemoteId,
      counts,
      finishedAt,
      errorMessage,
    );
  },

  async recordAuditEvent(input, payload) {
    if (!recordAuditEventUseCase) {
      return {
        success: true,
        value: true,
      };
    }

    const result = await recordAuditEventUseCase.execute({
      remoteId: `audit-sync-${payload.syncRunRemoteId}`,
      accountRemoteId: input.accountRemoteId,
      ownerUserRemoteId: input.ownerUserRemoteId,
      actorUserRemoteId: input.activeUserRemoteId ?? input.ownerUserRemoteId,
      module: AuditModule.Sync,
      action: "sync_run_completed",
      sourceModule: "sync",
      sourceRemoteId: payload.syncRunRemoteId,
      sourceAction: "run_sync_workflow",
      outcome:
        payload.outcome === "success"
          ? AuditOutcome.Success
          : AuditOutcome.Failure,
      severity:
        payload.outcome === "success"
          ? AuditSeverity.Info
          : AuditSeverity.Warning,
      summary: payload.message,
      metadataJson: JSON.stringify({
        pushedCount: payload.pushedCount,
        pulledCount: payload.pulledCount,
        conflictCount: payload.conflictCount,
        failedCount: payload.failedCount,
      }),
      createdAt: Date.now(),
    });

    if (!result.success) {
      return {
        success: false,
        error: new Error(result.error.message),
      };
    }

    return {
      success: true,
      value: true,
    };
  },
});
