import { SyncFeatureFlagRepository } from "../data/repository/syncFeatureFlag.repository";
import { GetSyncFeatureFlagUseCase } from "./getSyncFeatureFlag.useCase";

export const createGetSyncFeatureFlagUseCase = (
  repository: SyncFeatureFlagRepository,
): GetSyncFeatureFlagUseCase => ({
  async execute() {
    const result = await repository.getSyncFeatureFlag();
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      value: {
        syncEnabled: result.value,
      },
    };
  },
});
