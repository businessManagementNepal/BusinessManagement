import {
  SQLITE_MASTER_INDEX_EXISTS_SQL,
  databaseIntegrityInvariants,
} from "./databaseIntegrity.invariants";
import type {
  DatabaseIntegrityInvariant,
  DatabaseIntegritySqlRunner,
} from "./databaseIntegrity.types";

const buildIndexExistsArgs = (
  requiredIndexName: string,
): readonly [string, string] => ["index", requiredIndexName];

const assertRequiredIndexExists = async (
  runner: DatabaseIntegritySqlRunner,
  invariant: DatabaseIntegrityInvariant,
): Promise<void> => {
  const rows = await runner.fetchRaw(
    SQLITE_MASTER_INDEX_EXISTS_SQL,
    buildIndexExistsArgs(invariant.requiredIndexName),
  );

  if (rows.length === 0) {
    throw new Error(invariant.missingErrorMessage);
  }
};

const assertDuplicateRowsDoNotExist = async (
  runner: DatabaseIntegritySqlRunner,
  invariant: DatabaseIntegrityInvariant,
): Promise<void> => {
  const rows = await runner.fetchRaw(invariant.duplicateCheckSql);

  if (rows.length > 0) {
    throw new Error(invariant.duplicateErrorMessage);
  }
};

export const runDatabaseIntegrityChecks = async (
  runner: DatabaseIntegritySqlRunner,
): Promise<void> => {
  for (const invariant of databaseIntegrityInvariants) {
    await assertRequiredIndexExists(runner, invariant);
    await assertDuplicateRowsDoNotExist(runner, invariant);
  }
};
