export const SyncRunStatus = {
  Running: "running",
  Completed: "completed",
  Failed: "failed",
} as const;

export type SyncRunStatusValue =
  (typeof SyncRunStatus)[keyof typeof SyncRunStatus];

export const SyncOutboxStatus = {
  Pending: "pending",
  Syncing: "syncing",
  Synced: "synced",
  Failed: "failed",
  Conflict: "conflict",
} as const;

export type SyncOutboxStatusValue =
  (typeof SyncOutboxStatus)[keyof typeof SyncOutboxStatus];

export const SyncTombstonePolicy = {
  SoftDelete: "soft_delete",
  AppendOnly: "append_only",
  LocalOnly: "local_only",
} as const;

export type SyncTombstonePolicyValue =
  (typeof SyncTombstonePolicy)[keyof typeof SyncTombstonePolicy];
