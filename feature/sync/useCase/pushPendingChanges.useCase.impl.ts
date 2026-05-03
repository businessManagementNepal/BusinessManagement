import { syncDependencyOrder } from "../registry/syncDependencyOrder";
import { filterTableNamesByV1SyncRollout } from "../config/syncTableRollout.config";
import { SyncRepository } from "../data/repository/sync.repository";
import { PushPendingChangesUseCase } from "./pushPendingChanges.useCase";

export const createPushPendingChangesUseCase = (
  repository: SyncRepository,
): PushPendingChangesUseCase => ({
  async execute(scope) {
    let pushedCount = 0;
    let conflictCount = 0;
    let failedCount = 0;

    for (const tableName of filterTableNamesByV1SyncRollout(syncDependencyOrder)) {
      const pendingResult = await repository.getPendingChangeSet(scope, tableName);
      if (!pendingResult.success) {
        return pendingResult;
      }

      if (pendingResult.value.length === 0) {
        continue;
      }

      const pushResult = await repository.pushChanges({
        ...scope,
        changes: pendingResult.value,
      });
      if (!pushResult.success) {
        return pushResult;
      }

      const acknowledgementResult = await repository.applyPushAcknowledgements(
        scope,
        scope.syncRunRemoteId,
        pushResult.value.acknowledgements,
      );
      if (!acknowledgementResult.success) {
        return acknowledgementResult;
      }

      pushedCount += acknowledgementResult.value.pushedCount;
      conflictCount += acknowledgementResult.value.conflictCount;
      failedCount += acknowledgementResult.value.failedCount;
    }

    return {
      success: true,
      value: {
        pushedCount,
        conflictCount,
        failedCount,
      },
    };
  },
});
