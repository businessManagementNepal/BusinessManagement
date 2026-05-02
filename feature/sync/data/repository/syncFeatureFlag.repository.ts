import { SyncResult } from "@/shared/sync/types/syncResult.types";

export interface SyncFeatureFlagRepository {
  getSyncFeatureFlag(): Promise<SyncResult<boolean>>;
}
