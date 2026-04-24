import {
  BACKFILL_CONTACT_NORMALIZED_PHONE_SQL,
  CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_SQL,
  DEDUPE_CONTACT_NORMALIZED_PHONE_SQL,
  DROP_CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_SQL,
} from "@/feature/contacts/data/dataSource/db/contactPhone.uniqueIndex";
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

const getSqlSteps = (migration: MigrationDefinition): readonly string[] => {
  return migration.steps
    .map((step) => {
      const maybeSql = (step as { sql?: unknown }).sql;
      return typeof maybeSql === "string" ? maybeSql.trim() : null;
    })
    .filter((value): value is string => value !== null);
};

describe("database migration contract", () => {
  it("keeps app schema version aligned with the latest migration version", () => {
    const latestMigration = getLatestMigration();

    expect(APP_DATABASE_SCHEMA_VERSION).toBe(latestMigration.toVersion);
  });

  it("contains the contact index repair migration at version 42", () => {
    const migration42 = getMigrationByVersion(42);

    expect(migration42.toVersion).toBe(42);
  });

  it("runs contact index repair steps in the required release-safe order", () => {
    const migration42 = getMigrationByVersion(42);
    const sqlSteps = getSqlSteps(migration42);

    expect(sqlSteps).toEqual([
      BACKFILL_CONTACT_NORMALIZED_PHONE_SQL,
      DEDUPE_CONTACT_NORMALIZED_PHONE_SQL,
      DROP_CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_SQL,
      CONTACTS_ACTIVE_IDENTITY_PHONE_UNIQUE_INDEX_SQL,
    ]);
  });
});
