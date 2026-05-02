import { SyncLock } from "@/shared/sync/runtime/syncLock";
import { GetSyncFeatureFlagUseCase } from "@/feature/sync/useCase/getSyncFeatureFlag.useCase";
import { RunSyncWorkflowUseCase } from "./runSyncWorkflow.useCase";
import { SyncRunRepository } from "../repository/syncRun.repository";

type CreateRunSyncWorkflowUseCaseParams = {
  syncRunRepository: SyncRunRepository;
  syncLock: SyncLock;
  getSyncFeatureFlagUseCase: GetSyncFeatureFlagUseCase;
};

const createValidationError = (message: string): Error => new Error(message);

export const createRunSyncWorkflowUseCase = ({
  syncRunRepository,
  syncLock,
  getSyncFeatureFlagUseCase,
}: CreateRunSyncWorkflowUseCaseParams): RunSyncWorkflowUseCase => ({
  async execute(input) {
    if (!input.ownerUserRemoteId.trim()) {
      return {
        success: false,
        error: createValidationError("Sync requires an owner user context."),
      };
    }

    if (!input.activeUserRemoteId?.trim()) {
      return {
        success: false,
        error: createValidationError("Sync requires an active user session."),
      };
    }

    if (!input.activeAccountRemoteId?.trim()) {
      return {
        success: false,
        error: createValidationError("Sync requires an active account."),
      };
    }

    if (input.activeAccountRemoteId !== input.accountRemoteId) {
      return {
        success: false,
        error: createValidationError(
          "Sync account context does not match the active account.",
        ),
      };
    }

    const syncFeatureFlagResult = await getSyncFeatureFlagUseCase.execute();
    if (!syncFeatureFlagResult.success) {
      return {
        success: false,
        error: syncFeatureFlagResult.error,
      };
    }

    if (!syncFeatureFlagResult.value.syncEnabled) {
      return {
        success: false,
        error: createValidationError("Sync is disabled for this context."),
      };
    }

    const lock = syncLock.acquire();
    if (!lock.acquired) {
      return {
        success: false,
        error: createValidationError(
          `Sync already running since ${new Date(lock.state.startedAt).toISOString()}.`,
        ),
      };
    }

    let syncRunRemoteId: string | null = null;
    const counts = {
      pushedCount: 0,
      pulledCount: 0,
      conflictCount: 0,
      failedCount: 0,
    };

    try {
      const startedAt = Date.now();
      const createRunResult = await syncRunRepository.createRun(input, startedAt);
      if (!createRunResult.success) {
        return createRunResult;
      }

      syncRunRemoteId = createRunResult.value.remoteId;

      const pushResult = await syncRunRepository.pushPendingChanges(
        input,
        syncRunRemoteId,
      );
      if (!pushResult.success) {
        throw pushResult.error;
      }
      counts.pushedCount = pushResult.value.pushedCount;
      counts.conflictCount += pushResult.value.conflictCount;
      counts.failedCount += pushResult.value.failedCount;

      const pullResult = await syncRunRepository.pullRemoteChanges(input);
      if (!pullResult.success) {
        throw pullResult.error;
      }
      counts.pulledCount = pullResult.value.tables.reduce(
        (total, tableResult) => total + tableResult.changes.length,
        0,
      );

      const applyResult = await syncRunRepository.applyPulledChanges(
        input,
        pullResult.value,
      );
      if (!applyResult.success) {
        throw applyResult.error;
      }
      counts.conflictCount += applyResult.value.conflictCount;
      counts.failedCount += applyResult.value.failedCount;

      const rebuildResult = await syncRunRepository.rebuildProjections(
        input,
        applyResult.value,
      );
      if (!rebuildResult.success) {
        throw rebuildResult.error;
      }

      const checkpointResult = await syncRunRepository.saveCheckpoints(
        input,
        applyResult.value,
        Date.now(),
      );
      if (!checkpointResult.success) {
        throw checkpointResult.error;
      }

      const completeRunResult = await syncRunRepository.completeRun(
        syncRunRemoteId,
        counts,
        Date.now(),
      );
      if (!completeRunResult.success) {
        throw completeRunResult.error;
      }

      await syncRunRepository.recordAuditEvent(input, {
        syncRunRemoteId,
        outcome: "success",
        pushedCount: counts.pushedCount,
        pulledCount: counts.pulledCount,
        conflictCount: counts.conflictCount,
        failedCount: counts.failedCount,
        message: `Sync completed: pushed ${counts.pushedCount}, pulled ${counts.pulledCount}.`,
      });

      return {
        success: true,
        value: {
          syncRunRemoteId,
          pushedCount: counts.pushedCount,
          pulledCount: counts.pulledCount,
          conflictCount: counts.conflictCount,
          failedCount: counts.failedCount,
          applySummary: applyResult.value,
        },
      };
    } catch (error) {
      if (syncRunRemoteId) {
        await syncRunRepository.failRun(
          syncRunRemoteId,
          counts,
          Date.now(),
          error instanceof Error ? error.message : "Unknown sync failure.",
        );

        await syncRunRepository.recordAuditEvent(input, {
          syncRunRemoteId,
          outcome: "failure",
          pushedCount: counts.pushedCount,
          pulledCount: counts.pulledCount,
          conflictCount: counts.conflictCount,
          failedCount: counts.failedCount + 1,
          message:
            error instanceof Error ? error.message : "Unknown sync failure.",
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown sync failure."),
      };
    } finally {
      lock.release();
    }
  },
});
