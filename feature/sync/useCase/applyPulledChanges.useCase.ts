import { PullChangesResponseDto } from "../types/sync.dto.types";
import { SyncApplySummary } from "../types/sync.state.types";
import { SyncResult } from "@/shared/sync/types/syncResult.types";
import { SyncExecutionScope } from "../types/syncExecutionScope.types";

export interface ApplyPulledChangesUseCase {
  execute(
    scope: SyncExecutionScope,
    response: PullChangesResponseDto,
  ): Promise<SyncResult<SyncApplySummary>>;
}
