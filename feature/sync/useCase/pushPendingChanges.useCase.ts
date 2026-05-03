import { SyncResult } from "@/shared/sync/types/syncResult.types";
import { SyncExecutionScope } from "../types/syncExecutionScope.types";

export type PushPendingChangesResult = {
  pushedCount: number;
  conflictCount: number;
  failedCount: number;
};

export interface PushPendingChangesUseCase {
  execute(
    scope: SyncExecutionScope & {
      syncRunRemoteId: string;
    },
  ): Promise<SyncResult<PushPendingChangesResult>>;
}
