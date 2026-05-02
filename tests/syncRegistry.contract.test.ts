import {
  deviceLocalOnlyTables,
  getSyncRegistryItem,
  sensitiveSyncExcludedTables,
  supportUploadTables,
  syncRegistry,
} from "@/feature/sync/registry/syncRegistry";
import { syncDependencyOrder } from "@/feature/sync/registry/syncDependencyOrder";
import { SyncConflictPolicy } from "@/shared/sync/types/syncConflict.types";
import { describe, expect, it } from "vitest";

describe("sync registry contract", () => {
  it("contains every table from the dependency order", () => {
    const tableNames = new Set(syncRegistry.map((item) => item.tableName));
    for (const tableName of syncDependencyOrder) {
      expect(tableNames.has(tableName)).toBe(true);
    }
  });

  it("marks transactions and pos sales as manual-review financial records", () => {
    expect(getSyncRegistryItem("transactions")).toMatchObject({
      isFinancialRecord: true,
      conflictPolicy: SyncConflictPolicy.ManualReview,
    });
    expect(getSyncRegistryItem("pos_sales")).toMatchObject({
      isFinancialRecord: true,
      isWorkflowAggregate: true,
      conflictPolicy: SyncConflictPolicy.ManualReview,
    });
  });

  it("documents non-business sync tables explicitly", () => {
    expect(deviceLocalOnlyTables).toContain("app_settings");
    expect(sensitiveSyncExcludedTables).toContain("auth_credentials");
    expect(supportUploadTables).toContain("bug_reports");
  });
});
