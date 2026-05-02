import { APP_DATABASE_SCHEMA_VERSION } from "@/shared/database/appDatabaseSchemaVersion";
import { migrations } from "@/shared/database/migration";
import { describe, expect, it } from "vitest";

type MigrationStep =
  | { type: "sql"; sql: string }
  | { type: string; [key: string]: unknown };

type MigrationDefinition = {
  toVersion: number;
  steps: readonly MigrationStep[];
};

const getMigrationDefinitions = (): readonly MigrationDefinition[] => {
  const value = migrations as unknown as {
    sortedMigrations?: readonly MigrationDefinition[];
    migrations?: readonly MigrationDefinition[];
  };

  const definitions = value.sortedMigrations ?? value.migrations;

  if (!definitions) {
    throw new Error("Unable to read WatermelonDB migration definitions.");
  }

  return definitions;
};

const getLatestMigration = (): MigrationDefinition => {
  const definitions = getMigrationDefinitions();
  const latest = [...definitions].sort((a, b) => b.toVersion - a.toVersion)[0];

  if (!latest) {
    throw new Error("No database migrations found.");
  }

  return latest;
};

const getMigrationByVersion = (version: number): MigrationDefinition => {
  const migration = getMigrationDefinitions().find(
    (item) => item.toVersion === version,
  );

  if (!migration) {
    throw new Error(`Migration ${version} was not found.`);
  }

  return migration;
};

describe("database migration contract", () => {
  it("keeps app schema version aligned with the latest migration version", () => {
    const latestMigration = getLatestMigration();

    expect(APP_DATABASE_SCHEMA_VERSION).toBe(latestMigration.toVersion);
  });

  it("contains the audit events table migration at version 43", () => {
    const migration43 = getMigrationByVersion(43);
    const auditCreateStep = migration43.steps.find((step) => {
      const stepType = (step as { type?: unknown }).type;
      const tableName = (step as { table?: unknown }).table;
      return stepType === "create_table" && tableName === "audit_events";
    });

    expect(migration43.toVersion).toBe(43);
    expect(auditCreateStep).toBeDefined();
  });

  it("contains import job tables at version 46", () => {
    const migration46 = getMigrationByVersion(46);
    const importJobsCreateStep = migration46.steps.find((step) => {
      const stepType = (step as { type?: unknown }).type;
      const tableName = (step as { table?: unknown }).table;
      return stepType === "create_table" && tableName === "import_jobs";
    });
    const importJobRowsCreateStep = migration46.steps.find((step) => {
      const stepType = (step as { type?: unknown }).type;
      const tableName = (step as { table?: unknown }).table;
      return stepType === "create_table" && tableName === "import_job_rows";
    });

    expect(migration46.toVersion).toBe(46);
    expect(importJobsCreateStep).toBeDefined();
    expect(importJobRowsCreateStep).toBeDefined();
  });
});
