import {
  isConflictSyncStatus,
  isFailedSyncStatus,
  isPendingSyncStatus,
  normalizeSyncStatus,
  SyncStatus,
} from "@/shared/sync/types/syncStatus.types";
import { describe, expect, it } from "vitest";

describe("sync status types", () => {
  it("normalizes legacy failed into the standard sync_failed status", () => {
    expect(normalizeSyncStatus("failed")).toBe(SyncStatus.SyncFailed);
  });

  it("treats legacy pending and current pending statuses as pending work", () => {
    expect(isPendingSyncStatus("pending")).toBe(true);
    expect(isPendingSyncStatus(SyncStatus.PendingCreate)).toBe(true);
    expect(isPendingSyncStatus(SyncStatus.PendingUpdate)).toBe(true);
    expect(isPendingSyncStatus(SyncStatus.PendingDelete)).toBe(true);
  });

  it("recognizes failed and conflict states", () => {
    expect(isFailedSyncStatus("failed")).toBe(true);
    expect(isConflictSyncStatus("conflict")).toBe(true);
  });
});
