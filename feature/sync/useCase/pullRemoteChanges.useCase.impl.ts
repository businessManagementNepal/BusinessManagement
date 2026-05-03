import { filterTablesByV1SyncRollout } from "../config/syncTableRollout.config";
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

    const responseResult = await repository.pullChanges({
      ...requestResult.value,
      cursors: filterTablesByV1SyncRollout(requestResult.value.cursors),
    });
    if (!responseResult.success) {
      return responseResult;
    }

    return {
      success: true,
      value: {
        tables: filterTablesByV1SyncRollout(responseResult.value.tables),
      },
    };
  },
});
