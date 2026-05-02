import { SyncConflictResolutionActionValue, SyncConflictStatusValue } from "@/shared/sync/types/syncConflict.types";
import { SyncOperationValue } from "@/shared/sync/types/syncOperation.types";
import { SyncCheckpointCursor, SyncScope } from "@/shared/sync/types/syncScope.types";
import { Result } from "@/shared/types/result.types";
import { SyncStatusState } from "../../types/sync.state.types";
import {
  SyncCheckpoint,
  SyncConflictRecord,
  SyncErrorRecord,
  SyncOutboxRecord,
  SyncRawRecord,
  SyncRegistryItem,
  SyncRunRecord,
} from "../../types/sync.entity.types";

export type GetPendingRecordsByTableInput = SyncScope & {
  registryItem: SyncRegistryItem;
  includeFailed?: boolean;
  limit?: number;
};

export type UpdateSyncRecordStateInput = {
  registryItem: SyncRegistryItem;
  recordRemoteId: string;
  accountRemoteId: string;
  lastSyncedAt?: number | null;
  errorMessage?: string | null;
};

export type SaveCheckpointInput = SyncScope & SyncCheckpointCursor & {
  lastPulledAt: number;
};

export type CreateSyncRunInput = SyncScope & {
  startedAt: number;
};

export type CompleteSyncRunInput = {
  syncRunRemoteId: string;
  pushedCount: number;
  pulledCount: number;
  conflictCount: number;
  failedCount: number;
  finishedAt: number;
};

export type FailSyncRunInput = CompleteSyncRunInput & {
  errorMessage: string;
};

export type RecordSyncErrorInput = {
  syncRunRemoteId: string;
  tableName: string;
  recordRemoteId: string;
  operation: SyncOperationValue;
  errorType: string;
  errorMessage: string;
  retryCount?: number;
  nextRetryAt?: number | null;
};

export type RecordSyncConflictInput = {
  tableName: string;
  recordRemoteId: string;
  accountRemoteId: string;
  localPayloadJson: string;
  remotePayloadJson: string;
  conflictPolicy: import("@/shared/sync/types/syncConflict.types").SyncConflictPolicyValue;
};

export type QueueOutboxRecordInput = {
  tableName: string;
  recordRemoteId: string;
  accountRemoteId: string;
  operation: SyncOperationValue;
  payload: Record<string, unknown>;
};

export type ResolveSyncConflictInput = {
  conflictRemoteId: string;
  nextStatus?: SyncConflictStatusValue;
  resolutionAction: SyncConflictResolutionActionValue;
};

export interface SyncLocalDatasource {
  getPendingRecordsByTable(
    input: GetPendingRecordsByTableInput,
  ): Promise<Result<SyncRawRecord[]>>;

  getLocalRecord(
    registryItem: SyncRegistryItem,
    recordRemoteId: string,
    accountRemoteId: string,
  ): Promise<Result<SyncRawRecord | null>>;

  upsertPulledRecord(
    registryItem: SyncRegistryItem,
    recordRemoteId: string,
    payload: Record<string, unknown>,
  ): Promise<Result<SyncRawRecord>>;

  tombstoneRecord(
    registryItem: SyncRegistryItem,
    recordRemoteId: string,
    deletedAt: number,
  ): Promise<Result<boolean>>;

  queueOutboxRecord(
    input: QueueOutboxRecordInput,
  ): Promise<Result<SyncOutboxRecord>>;

  markRecordSyncing(
    input: UpdateSyncRecordStateInput,
  ): Promise<Result<boolean>>;

  markRecordSynced(
    input: UpdateSyncRecordStateInput,
  ): Promise<Result<boolean>>;

  markRecordSyncFailed(
    input: UpdateSyncRecordStateInput,
  ): Promise<Result<boolean>>;

  markRecordConflict(
    input: UpdateSyncRecordStateInput,
  ): Promise<Result<boolean>>;

  getCheckpoint(
    scope: SyncScope,
    tableName: string,
  ): Promise<Result<SyncCheckpoint | null>>;

  saveCheckpoint(input: SaveCheckpointInput): Promise<Result<SyncCheckpoint>>;

  createSyncRun(input: CreateSyncRunInput): Promise<Result<SyncRunRecord>>;

  completeSyncRun(
    input: CompleteSyncRunInput,
  ): Promise<Result<SyncRunRecord>>;

  failSyncRun(input: FailSyncRunInput): Promise<Result<SyncRunRecord>>;

  recordSyncError(
    input: RecordSyncErrorInput,
  ): Promise<Result<SyncErrorRecord>>;

  recordSyncConflict(
    input: RecordSyncConflictInput,
  ): Promise<Result<SyncConflictRecord>>;

  listOpenConflicts(
    accountRemoteId: string,
  ): Promise<Result<SyncConflictRecord[]>>;

  resolveConflict(
    input: ResolveSyncConflictInput,
  ): Promise<Result<boolean>>;

  getSyncStatusSummary(scope: SyncScope): Promise<Result<SyncStatusState>>;

  getLatestCompletedSyncRun(
    scope: SyncScope,
  ): Promise<Result<SyncRunRecord | null>>;
}
