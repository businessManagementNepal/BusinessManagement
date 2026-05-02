import { PullChangesResponseDto } from "../types/sync.dto.types";
import { SyncApplySummary } from "../types/sync.state.types";
import { SyncResult } from "@/shared/sync/types/syncResult.types";
import { SyncScope } from "@/shared/sync/types/syncScope.types";

export interface ApplyPulledChangesUseCase {
  execute(
    scope: SyncScope,
    response: PullChangesResponseDto,
  ): Promise<SyncResult<SyncApplySummary>>;
}
