import { APP_DATABASE_SCHEMA_VERSION } from "@/shared/database/appDatabaseSchemaVersion";
import { migrations } from "@/shared/database/migration";
import { describe, expect, it } from "vitest";

type MigrationStep = {
  type?: string;
  table?: string;
  schema?: {
    name?: string;
  };
};

type MigrationDefinition = {
  toVersion: number;
  steps: readonly MigrationStep[];
};

const getMigrationDefinitions = (): readonly MigrationDefinition[] => {
  const value = migrations as unknown as {
    sortedMigrations?: readonly MigrationDefinition[];
    migrations?: readonly MigrationDefinition[];
  };

  return value.sortedMigrations ?? value.migrations ?? [];
};

describe("sync migration contract", () => {
  it("advances the schema to version 46", () => {
    expect(APP_DATABASE_SCHEMA_VERSION).toBe(46);
  });

  it("creates all sync infrastructure tables in migration 45", () => {
    const migration45 = getMigrationDefinitions().find(
      (definition) => definition.toVersion === 45,
    );

    expect(migration45).toBeDefined();
    const createdTables = new Set(
      migration45?.steps
        .filter((step) => step.type === "create_table")
        .map((step) => step.table ?? step.schema?.name),
    );

    expect(createdTables).toEqual(
      new Set([
        "sync_checkpoints",
        "sync_runs",
        "sync_errors",
        "sync_conflicts",
        "sync_outbox",
      ]),
    );
  });
});
