import { SyncApplySummary } from "@/feature/sync/types/sync.state.types";
import { SyncResult } from "@/shared/sync/types/syncResult.types";
import { SyncScope } from "@/shared/sync/types/syncScope.types";

export type RunSyncWorkflowInput = SyncScope & {
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
