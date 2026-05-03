import { SyncFeatureFlagRepository } from "../data/repository/syncFeatureFlag.repository";
import { UpdateSyncFeatureFlagUseCase } from "./updateSyncFeatureFlag.useCase";

export const createUpdateSyncFeatureFlagUseCase = (
  repository: SyncFeatureFlagRepository,
): UpdateSyncFeatureFlagUseCase => ({
  async execute(enabled) {
    const result = await repository.setSyncFeatureFlag(enabled);
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
