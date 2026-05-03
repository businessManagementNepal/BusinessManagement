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
  it("advances the schema to version 50", () => {
    expect(APP_DATABASE_SCHEMA_VERSION).toBe(50);
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

  it("adds money account opening balance fields in migration 47", () => {
    const migration47 = getMigrationDefinitions().find(
      (definition) => definition.toVersion === 47,
    );

    expect(migration47).toBeDefined();
    const serializedSteps = JSON.stringify(migration47?.steps ?? []);
    expect(serializedSteps).toContain("opening_balance_amount");
    expect(serializedSteps).toContain("opening_balance_direction");
    expect(serializedSteps).toContain("UPDATE money_accounts");
  });

  it("adds server_revision coverage in migration 48", () => {
    const migration48 = getMigrationDefinitions().find(
      (definition) => definition.toVersion === 48,
    );

    expect(migration48).toBeDefined();
    const serializedSteps = JSON.stringify(migration48?.steps ?? []);
    expect(serializedSteps).toContain('"table":"contacts"');
    expect(serializedSteps).toContain('"table":"money_accounts"');
    expect(serializedSteps).toContain('"table":"orders"');
    expect(serializedSteps).toContain('"table":"bill_photos"');
    expect(serializedSteps).toContain("server_revision");
  });

  it("adds sync_enabled to app_settings in migration 49", () => {
    const migration49 = getMigrationDefinitions().find(
      (definition) => definition.toVersion === 49,
    );

    expect(migration49).toBeDefined();
    const serializedSteps = JSON.stringify(migration49?.steps ?? []);
    expect(serializedSteps).toContain('"table":"app_settings"');
    expect(serializedSteps).toContain("sync_enabled");
    expect(serializedSteps).toContain("UPDATE app_settings");
  });

  it("adds categories server_revision coverage in migration 50", () => {
    const migration50 = getMigrationDefinitions().find(
      (definition) => definition.toVersion === 50,
    );

    expect(migration50).toBeDefined();
    const serializedSteps = JSON.stringify(migration50?.steps ?? []);
    expect(serializedSteps).toContain('"table":"categories"');
    expect(serializedSteps).toContain("server_revision");
  });
});
