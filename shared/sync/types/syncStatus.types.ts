export const SyncStatus = {
  PendingCreate: "pending_create",
  PendingUpdate: "pending_update",
  PendingDelete: "pending_delete",
  Syncing: "syncing",
  Synced: "synced",
  SyncFailed: "sync_failed",
  Conflict: "conflict",
} as const;

export type SyncStatusValue = (typeof SyncStatus)[keyof typeof SyncStatus];

export const LegacySyncStatus = {
  Pending: "pending",
  Failed: "failed",
} as const;

export type LegacySyncStatusValue =
  (typeof LegacySyncStatus)[keyof typeof LegacySyncStatus];

export const SYNC_STATUS_COMPATIBILITY_MAP: Readonly<
  Record<SyncStatusValue | LegacySyncStatusValue, SyncStatusValue>
> = {
  pending_create: SyncStatus.PendingCreate,
  pending_update: SyncStatus.PendingUpdate,
  pending_delete: SyncStatus.PendingDelete,
  syncing: SyncStatus.Syncing,
  synced: SyncStatus.Synced,
  sync_failed: SyncStatus.SyncFailed,
  conflict: SyncStatus.Conflict,
  pending: SyncStatus.PendingUpdate,
  failed: SyncStatus.SyncFailed,
} as const;

export const normalizeSyncStatus = (
  status: string | null | undefined,
): SyncStatusValue | null => {
  if (!status) {
    return null;
  }

  return SYNC_STATUS_COMPATIBILITY_MAP[
    status as SyncStatusValue | LegacySyncStatusValue
  ] ?? null;
};

export const isPendingSyncStatus = (
  status: string | null | undefined,
): boolean => {
  const normalized = normalizeSyncStatus(status);
  return (
    normalized === SyncStatus.PendingCreate ||
    normalized === SyncStatus.PendingUpdate ||
    normalized === SyncStatus.PendingDelete ||
    normalized === SyncStatus.Syncing
  );
};

export const isFailedSyncStatus = (
  status: string | null | undefined,
): boolean => {
  return normalizeSyncStatus(status) === SyncStatus.SyncFailed;
};

export const isConflictSyncStatus = (
  status: string | null | undefined,
): boolean => {
  return normalizeSyncStatus(status) === SyncStatus.Conflict;
};
