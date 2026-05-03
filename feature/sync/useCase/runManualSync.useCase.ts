import { SyncResult } from "@/shared/sync/types/syncResult.types";
import { RunSyncWorkflowOutput } from "../workflow/syncRun/types/syncRun.types";

export type RunManualSyncInput = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
};

export interface RunManualSyncUseCase {
  execute(
    input: RunManualSyncInput,
  ): Promise<SyncResult<RunSyncWorkflowOutput>>;
}
