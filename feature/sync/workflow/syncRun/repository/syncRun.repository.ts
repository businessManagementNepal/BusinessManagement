import { SyncResult } from "@/shared/sync/types/syncResult.types";
import { SyncRunRecord } from "@/feature/sync/types/sync.entity.types";
import { RunSyncWorkflowInput } from "../types/syncRun.types";
import { PullChangesResponseDto } from "@/feature/sync/types/sync.dto.types";
import { SyncApplySummary } from "@/feature/sync/types/sync.state.types";

export interface SyncRunRepository {
  createRun(input: RunSyncWorkflowInput, startedAt: number): Promise<SyncResult<SyncRunRecord>>;
  pushPendingChanges(input: RunSyncWorkflowInput, syncRunRemoteId: string): Promise<
    SyncResult<{
      pushedCount: number;
      conflictCount: number;
      failedCount: number;
    }>
  >;
  pullRemoteChanges(input: RunSyncWorkflowInput): Promise<SyncResult<PullChangesResponseDto>>;
  applyPulledChanges(
    input: RunSyncWorkflowInput,
    response: PullChangesResponseDto,
  ): Promise<SyncResult<SyncApplySummary>>;
  rebuildProjections(
    input: RunSyncWorkflowInput,
    applySummary: SyncApplySummary,
  ): Promise<SyncResult<boolean>>;
  saveCheckpoints(
    input: RunSyncWorkflowInput,
    applySummary: SyncApplySummary,
    lastPulledAt: number,
  ): Promise<SyncResult<boolean>>;
  completeRun(
    syncRunRemoteId: string,
    counts: {
      pushedCount: number;
      pulledCount: number;
      conflictCount: number;
      failedCount: number;
    },
    finishedAt: number,
  ): Promise<SyncResult<SyncRunRecord>>;
  failRun(
    syncRunRemoteId: string,
    counts: {
      pushedCount: number;
      pulledCount: number;
      conflictCount: number;
      failedCount: number;
    },
    finishedAt: number,
    errorMessage: string,
  ): Promise<SyncResult<SyncRunRecord>>;
  recordAuditEvent(
    input: RunSyncWorkflowInput,
    payload: {
      syncRunRemoteId: string;
      outcome: "success" | "failure";
      pushedCount: number;
      pulledCount: number;
      conflictCount: number;
      failedCount: number;
      message: string;
    },
  ): Promise<SyncResult<boolean>>;
}
