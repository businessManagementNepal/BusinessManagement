import { Result } from "@/shared/types/result.types";

export type SyncCounts = {
  pushedCount: number;
  pulledCount: number;
  conflictCount: number;
  failedCount: number;
  pendingCount: number;
};

export type SyncStatusSummary = SyncCounts & {
  lastSyncedAt: number | null;
  isRunning: boolean;
};

export type SyncResult<T, E = Error> = Result<T, E>;
