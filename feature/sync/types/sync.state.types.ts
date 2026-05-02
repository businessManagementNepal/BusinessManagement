import { SyncConflictRecord, SyncRunRecord } from "./sync.entity.types";

export type SyncStatusState = {
  lastSyncedAt: number | null;
  pendingChangesCount: number;
  failedRecordsCount: number;
  conflictCount: number;
  isRunning: boolean;
};

export type SyncApplySummary = {
  appliedCount: number;
  conflictCount: number;
  failedCount: number;
  touchedMoneyAccountProjection: boolean;
  touchedInventoryProjection: boolean;
  checkpointUpdates: {
    tableName: string;
    serverCursor: string | null;
  }[];
};

export type SyncWorkflowState = {
  currentRun: SyncRunRecord | null;
  conflicts: SyncConflictRecord[];
};
