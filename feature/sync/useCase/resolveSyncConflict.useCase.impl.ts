import { SyncRepository } from "../data/repository/sync.repository";
import { ResolveSyncConflictUseCase } from "./resolveSyncConflict.useCase";

export const createResolveSyncConflictUseCase = (
  repository: SyncRepository,
): ResolveSyncConflictUseCase => ({
  execute(conflictRemoteId, resolutionAction) {
    return repository.resolveConflict(conflictRemoteId, resolutionAction);
  },
});
