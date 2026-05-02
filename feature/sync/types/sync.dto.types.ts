import { SyncConflictPolicyValue } from "@/shared/sync/types/syncConflict.types";
import { SyncOperationValue } from "@/shared/sync/types/syncOperation.types";
import { SyncCheckpointCursor, SyncScope } from "@/shared/sync/types/syncScope.types";

export type SyncChangeSetDto = {
  tableName: string;
  operation: SyncOperationValue;
  recordRemoteId: string;
  payload: Record<string, unknown>;
  serverRevision: string | null;
  changedAt: number;
};

export type PushChangesRequestDto = SyncScope & {
  syncRunRemoteId: string;
  changes: SyncChangeSetDto[];
};

export type SyncRecordAckDto = {
  tableName: string;
  recordRemoteId: string;
  status: "accepted" | "rejected" | "conflict";
  serverRevision: string | null;
  errorCode?: string;
  errorMessage?: string;
  conflictPolicy?: SyncConflictPolicyValue;
};

export type PushChangesResponseDto = {
  acknowledgements: SyncRecordAckDto[];
};

export type PullChangesRequestDto = SyncScope & {
  cursors: SyncCheckpointCursor[];
};

export type PullChangesTableResultDto = {
  tableName: string;
  serverCursor: string | null;
  changes: SyncChangeSetDto[];
};

export type PullChangesResponseDto = {
  tables: PullChangesTableResultDto[];
};
