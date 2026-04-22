export type DatabaseIntegritySqlArg = string | number | null;

export type DatabaseIntegrityRawRow = Record<string, unknown>;

export interface DatabaseIntegritySqlRunner {
  fetchRaw(
    sql: string,
    args?: readonly DatabaseIntegritySqlArg[],
  ): Promise<readonly DatabaseIntegrityRawRow[]>;
}

export interface DatabaseIntegrityInvariant {
  key: string;
  requiredIndexName: string;
  missingErrorMessage: string;
  duplicateErrorMessage: string;
  duplicateCheckSql: string;
}
