import { SyncConflictRecord, SyncRunRecord } from "@/feature/sync/types/sync.entity.types";
import {
  PullChangesRequestDto,
  PullChangesResponseDto,
  PushChangesRequestDto,
  SyncChangeSetDto,
  SyncRecordAckDto,
} from "@/feature/sync/types/sync.dto.types";
import { SyncExecutionScope } from "@/feature/sync/types/syncExecutionScope.types";
import { SyncApplySummary, SyncStatusState } from "@/feature/sync/types/sync.state.types";
import { SyncResult } from "@/shared/sync/types/syncResult.types";
import { SyncScope } from "@/shared/sync/types/syncScope.types";

export interface SyncRepository {
  getSyncStatus(scope: SyncScope): Promise<SyncResult<SyncStatusState>>;

  createSyncRun(scope: SyncScope, startedAt: number): Promise<SyncResult<SyncRunRecord>>;

  completeSyncRun(
    syncRunRemoteId: string,
    counts: {
      pushedCount: number;
      pulledCount: number;
      conflictCount: number;
      failedCount: number;
    },
    finishedAt: number,
  ): Promise<SyncResult<SyncRunRecord>>;

  failSyncRun(
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

  getPendingChangeSet(
    scope: SyncExecutionScope,
    tableName: string,
  ): Promise<SyncResult<SyncChangeSetDto[]>>;

  pushChanges(
    input: PushChangesRequestDto,
  ): Promise<SyncResult<import("@/feature/sync/types/sync.dto.types").PushChangesResponseDto>>;

  applyPushAcknowledgements(
    scope: SyncExecutionScope,
    syncRunRemoteId: string,
    acknowledgements: readonly SyncRecordAckDto[],
  ): Promise<
    SyncResult<{
      pushedCount: number;
      conflictCount: number;
      failedCount: number;
    }>
  >;

  getPullRequest(
    scope: SyncExecutionScope,
  ): Promise<SyncResult<PullChangesRequestDto>>;

  pullChanges(
    input: PullChangesRequestDto,
  ): Promise<SyncResult<PullChangesResponseDto>>;

  applyPulledChanges(
    scope: SyncExecutionScope,
    response: PullChangesResponseDto,
  ): Promise<SyncResult<SyncApplySummary>>;

  saveCheckpoints(
    scope: SyncExecutionScope,
    checkpoints: readonly {
      tableName: string;
      serverCursor: string | null;
    }[],
    lastPulledAt: number,
  ): Promise<SyncResult<boolean>>;

  listOpenConflicts(accountRemoteId: string): Promise<SyncResult<SyncConflictRecord[]>>;

  resolveConflict(
    conflictRemoteId: string,
    resolutionAction: import("@/shared/sync/types/syncConflict.types").SyncConflictResolutionActionValue,
  ): Promise<SyncResult<boolean>>;
}
