import { SyncConflictPolicyValue, SyncConflictStatusValue } from "@/shared/sync/types/syncConflict.types";
import { SyncOperationValue } from "@/shared/sync/types/syncOperation.types";
import { SyncStatusValue } from "@/shared/sync/types/syncStatus.types";
import { SyncOutboxStatusValue, SyncRunStatusValue, SyncTombstonePolicyValue } from "./sync.constant";

export type SyncCheckpoint = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  tableName: string;
  serverCursor: string | null;
  lastPulledAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type SyncRunRecord = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  status: SyncRunStatusValue;
  startedAt: number;
  finishedAt: number | null;
  pushedCount: number;
  pulledCount: number;
  conflictCount: number;
  failedCount: number;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
};

export type SyncErrorRecord = {
  remoteId: string;
  syncRunRemoteId: string;
  tableName: string;
  recordRemoteId: string;
  operation: SyncOperationValue;
  errorType: string;
  errorMessage: string;
  retryCount: number;
  nextRetryAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type SyncConflictRecord = {
  remoteId: string;
  tableName: string;
  recordRemoteId: string;
  accountRemoteId: string;
  localPayloadJson: string;
  remotePayloadJson: string;
  conflictPolicy: SyncConflictPolicyValue;
  status: SyncConflictStatusValue;
  createdAt: number;
  updatedAt: number;
};

export type SyncOutboxRecord = {
  remoteId: string;
  tableName: string;
  recordRemoteId: string;
  accountRemoteId: string;
  operation: SyncOperationValue;
  payloadJson: string;
  status: SyncOutboxStatusValue;
  attemptCount: number;
  lastAttemptedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type SyncRawRecord = {
  id?: string;
  tableName: string;
  recordRemoteId: string;
  accountRemoteId: string | null;
  ownerUserRemoteId: string | null;
  recordSyncStatus: string | null;
  lastSyncedAt: number | null;
  deletedAt: number | null;
  createdAt: number | null;
  updatedAt: number | null;
  payload: Record<string, unknown>;
};

export type SyncRegistryItem = {
  tableName: string;
  entityName: string;
  scopeField: string;
  dependsOn: readonly string[];
  conflictPolicy: SyncConflictPolicyValue;
  tombstonePolicy: SyncTombstonePolicyValue;
  isFinancialRecord: boolean;
  isWorkflowAggregate: boolean;
  supportsDirectStatusTracking?: boolean;
  protectedFields?: readonly string[];
  ignoredPullFields?: readonly string[];
  terminalStatuses?: readonly string[];
  syncStatusField?: string;
  deletedAtField?: string;
  remoteIdField?: string;
  lastSyncedAtField?: string;
  compositeRemoteIdFields?: readonly string[];
  scopeJoin?: {
    parentTable: string;
    parentJoinField: string;
    childJoinField: string;
    parentScopeField: string;
    parentDeletedAtField?: string;
  };
};

export type SyncMutationState = {
  nextStatus: SyncStatusValue;
  lastSyncedAt: number | null;
};
