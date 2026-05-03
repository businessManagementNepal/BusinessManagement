import { mapLocalRecordToRemoteSyncPayload } from "@/feature/sync/mapper/mapLocalRecordToRemoteSyncPayload";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const loadFixture = (name: string) => {
  const filePath = path.resolve(process.cwd(), "docs", "sync-fixtures", name);
  return JSON.parse(readFileSync(filePath, "utf8")) as {
    tableName: string;
    payload: Record<string, unknown>;
  };
};

describe("sync contract fixtures", () => {
  it("generates the staged contact sync payload fixture", () => {
    const fixture = loadFixture("contacts.create.json");

    expect(
      mapLocalRecordToRemoteSyncPayload(fixture.tableName, {
        ...fixture.payload,
        id: "local-row-1",
        sync_status: "pending_create",
        last_synced_at: null,
        server_revision: null,
      }),
    ).toEqual(fixture.payload);
  });

  it("generates the staged category sync payload fixture", () => {
    const fixture = loadFixture("categories.create.json");

    expect(
      mapLocalRecordToRemoteSyncPayload(fixture.tableName, {
        ...fixture.payload,
        id: "local-row-2",
        sync_status: "pending_create",
        last_synced_at: null,
      }),
    ).toEqual(fixture.payload);
  });

  it("generates the staged product sync payload fixture without stock projection fields", () => {
    const fixture = loadFixture("products.create.json");

    expect(
      mapLocalRecordToRemoteSyncPayload(fixture.tableName, {
        ...fixture.payload,
        stock_quantity: 42,
        id: "local-row-3",
        sync_status: "pending_create",
        last_synced_at: null,
      }),
    ).toEqual(fixture.payload);
  });
});
