import { SyncResult } from "@/shared/sync/types/syncResult.types";
import { SyncScope } from "@/shared/sync/types/syncScope.types";

export type PushPendingChangesResult = {
  pushedCount: number;
  conflictCount: number;
  failedCount: number;
};

export interface PushPendingChangesUseCase {
  execute(
    scope: SyncScope & {
      syncRunRemoteId: string;
    },
  ): Promise<SyncResult<PushPendingChangesResult>>;
}
