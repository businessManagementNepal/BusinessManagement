import { SyncResult } from "@/shared/sync/types/syncResult.types";

export type GetSyncFeatureFlagOutput = {
  syncEnabled: boolean;
};

export interface GetSyncFeatureFlagUseCase {
  execute(): Promise<SyncResult<GetSyncFeatureFlagOutput>>;
}
