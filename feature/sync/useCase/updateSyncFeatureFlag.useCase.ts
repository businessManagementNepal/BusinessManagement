import { SyncResult } from "@/shared/sync/types/syncResult.types";

export type UpdateSyncFeatureFlagOutput = {
  syncEnabled: boolean;
};

export interface UpdateSyncFeatureFlagUseCase {
  execute(enabled: boolean): Promise<SyncResult<UpdateSyncFeatureFlagOutput>>;
}
