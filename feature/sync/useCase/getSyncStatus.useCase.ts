import { SyncResult } from "@/shared/sync/types/syncResult.types";
import { SyncScope } from "@/shared/sync/types/syncScope.types";
import { SyncStatusState } from "../types/sync.state.types";

export interface GetSyncStatusUseCase {
  execute(scope: SyncScope): Promise<SyncResult<SyncStatusState>>;
}
