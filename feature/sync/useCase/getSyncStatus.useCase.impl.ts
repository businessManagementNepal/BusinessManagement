import { SyncRepository } from "../data/repository/sync.repository";
import { GetSyncStatusUseCase } from "./getSyncStatus.useCase";

export const createGetSyncStatusUseCase = (
  repository: SyncRepository,
): GetSyncStatusUseCase => ({
  execute(scope) {
    return repository.getSyncStatus(scope);
  },
});
