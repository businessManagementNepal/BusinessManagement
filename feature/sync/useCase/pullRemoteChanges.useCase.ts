import { PullChangesResponseDto } from "../types/sync.dto.types";
import { SyncResult } from "@/shared/sync/types/syncResult.types";
import { SyncScope } from "@/shared/sync/types/syncScope.types";

export interface PullRemoteChangesUseCase {
  execute(scope: SyncScope): Promise<SyncResult<PullChangesResponseDto>>;
}
