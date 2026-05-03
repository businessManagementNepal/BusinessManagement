import { SyncApplySummary } from "@/feature/sync/types/sync.state.types";
import { SyncResult } from "@/shared/sync/types/syncResult.types";
import { SyncExecutionScope } from "@/feature/sync/types/syncExecutionScope.types";

export type RunSyncWorkflowInput = SyncExecutionScope & {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
};

export type RunSyncWorkflowOutput = {
  syncRunRemoteId: string;
  pushedCount: number;
  pulledCount: number;
  conflictCount: number;
  failedCount: number;
  applySummary: SyncApplySummary;
};

export type RunSyncWorkflowResult = SyncResult<RunSyncWorkflowOutput>;
