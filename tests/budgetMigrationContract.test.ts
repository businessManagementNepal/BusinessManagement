import { APP_DATABASE_SCHEMA_VERSION } from "@/shared/database/appDatabaseSchemaVersion";
import { migrations } from "@/shared/database/migration";
import { describe, expect, it } from "vitest";

type MigrationDefinition = {
  toVersion: number;
  steps: readonly unknown[];
};

const getMigrationDefinitions = (): readonly MigrationDefinition[] => {
  const value = migrations as unknown as {
    sortedMigrations?: readonly MigrationDefinition[];
    migrations?: readonly MigrationDefinition[];
  };

  return value.sortedMigrations ?? value.migrations ?? [];
};

describe("budget migration contract", () => {
  it("advances the database schema to version 52", () => {
    expect(APP_DATABASE_SCHEMA_VERSION).toBe(52);
  });

  it("adds stable category fields to transactions in migration 52", () => {
    const migration52 = getMigrationDefinitions().find(
      (definition) => definition.toVersion === 52,
    );

    expect(migration52).toBeDefined();
    const serializedSteps = JSON.stringify(migration52?.steps ?? []);
    expect(serializedSteps).toContain('"table":"transactions"');
    expect(serializedSteps).toContain("category_remote_id");
    expect(serializedSteps).toContain("category_name_snapshot");
  });
});
