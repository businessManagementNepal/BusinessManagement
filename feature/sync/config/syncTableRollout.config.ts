import { SyncDependencyTableName } from "../registry/syncDependencyOrder";

export const v1StagingSyncTables = [
  "contacts",
  "categories",
  "products",
] as const satisfies readonly SyncDependencyTableName[];

const v1StagingSyncTableSet = new Set<string>(v1StagingSyncTables);

export const getV1SyncRolloutTables = (): readonly SyncDependencyTableName[] => {
  return v1StagingSyncTables;
};

export const isTableEnabledInV1SyncRollout = (tableName: string): boolean => {
  return v1StagingSyncTableSet.has(tableName);
};

export const filterTablesByV1SyncRollout = <T extends { tableName: string }>(
  tables: readonly T[],
): T[] => {
  return tables.filter((table) => isTableEnabledInV1SyncRollout(table.tableName));
};

export const filterTableNamesByV1SyncRollout = <T extends string>(
  tableNames: readonly T[],
): T[] => {
  return tableNames.filter((tableName) =>
    isTableEnabledInV1SyncRollout(tableName),
  );
};
