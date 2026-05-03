import { PullChangesResponseDto } from "../types/sync.dto.types";
import { SyncResult } from "@/shared/sync/types/syncResult.types";
import { SyncExecutionScope } from "../types/syncExecutionScope.types";

export interface PullRemoteChangesUseCase {
  execute(scope: SyncExecutionScope): Promise<SyncResult<PullChangesResponseDto>>;
}
