import { SyncFeatureFlagDatasource } from "../dataSource/syncFeatureFlag.datasource";
import { SyncFeatureFlagRepository } from "./syncFeatureFlag.repository";

export const createSyncFeatureFlagRepository = (
  datasource: SyncFeatureFlagDatasource,
): SyncFeatureFlagRepository => ({
  getSyncFeatureFlag() {
    return datasource.getSyncEnabled();
  },

  setSyncFeatureFlag(enabled: boolean) {
    return datasource.setSyncEnabled(enabled);
  },
});
