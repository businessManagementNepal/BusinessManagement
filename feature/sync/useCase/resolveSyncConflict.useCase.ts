import { SyncConflictResolutionActionValue } from "@/shared/sync/types/syncConflict.types";
import { SyncResult } from "@/shared/sync/types/syncResult.types";

export interface ResolveSyncConflictUseCase {
  execute(
    conflictRemoteId: string,
    resolutionAction: SyncConflictResolutionActionValue,
  ): Promise<SyncResult<boolean>>;
}
