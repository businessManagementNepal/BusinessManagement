import { SyncRepository } from "../data/repository/sync.repository";
import { PullRemoteChangesUseCase } from "./pullRemoteChanges.useCase";

export const createPullRemoteChangesUseCase = (
  repository: SyncRepository,
): PullRemoteChangesUseCase => ({
  async execute(scope) {
    const requestResult = await repository.getPullRequest(scope);
    if (!requestResult.success) {
      return requestResult;
    }

    return repository.pullChanges(requestResult.value);
  },
});
