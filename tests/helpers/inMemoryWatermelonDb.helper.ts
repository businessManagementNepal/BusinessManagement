import type { Database } from "@nozbe/watermelondb";

type WhereClause = {
  type: "where";
  left: string;
  comparison: {
    operator: string;
    right?: {
      value?: unknown;
      values?: readonly unknown[];
    };
  };
};

type OrClause = {
  type: "or";
  conditions: readonly WhereClause[];
};

type SortByClause = {
  type: "sortBy";
  sortColumn: string;
  sortOrder: "asc" | "desc";
};

type TakeClause = {
  type: "take";
  count: number;
};

type QueryClause = WhereClause | OrClause | SortByClause | TakeClause;

type MutableRecord = {
  id: string;
  _raw: Record<string, unknown>;
  update: (mutator: (record: MutableRecord) => void) => Promise<void>;
  destroyPermanently: () => Promise<void>;
  [key: string]: unknown;
};

const toRecordKey = (column: string): string =>
  column.replace(/_([a-z])/g, (_match, character: string) =>
    character.toUpperCase(),
  );

const getFieldValue = (record: MutableRecord, column: string): unknown => {
  if (column === "created_at" || column === "updated_at") {
    return Number(record._raw[column] ?? 0);
  }

  const value = record[toRecordKey(column)];
  return value instanceof Date ? value.getTime() : value;
};

const matchesWhereClause = (record: MutableRecord, clause: WhereClause): boolean => {
  const leftValue = getFieldValue(record, clause.left);
  const operator = clause.comparison.operator;

  if (operator === "eq") {
    return leftValue === clause.comparison.right?.value;
  }

  if (operator === "oneOf") {
    const values = clause.comparison.right?.values ?? [];
    return values.includes(leftValue);
  }

  return false;
};

const matchesClause = (record: MutableRecord, clause: QueryClause): boolean => {
  if (clause.type === "where") {
    return matchesWhereClause(record, clause);
  }

  if (clause.type === "or") {
    return clause.conditions.some((condition) =>
      matchesWhereClause(record, condition),
    );
  }

  return true;
};

const compareNullableValues = (left: unknown, right: unknown): number => {
  if (left === right) {
    return 0;
  }

  if (left === null || left === undefined) {
    return -1;
  }

  if (right === null || right === undefined) {
    return 1;
  }

  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right));
};

const applyClauses = (
  records: readonly MutableRecord[],
  clauses: readonly QueryClause[],
): MutableRecord[] => {
  const filterClauses = clauses.filter(
    (clause) => clause.type === "where" || clause.type === "or",
  );
  const sortClauses = clauses.filter(
    (clause): clause is SortByClause => clause.type === "sortBy",
  );
  const takeClause = clauses.find(
    (clause): clause is TakeClause => clause.type === "take",
  );

  let result = records.filter((record) =>
    filterClauses.every((clause) => matchesClause(record, clause)),
  );

  if (sortClauses.length > 0) {
    result = [...result].sort((leftRecord, rightRecord) => {
      for (const sortClause of sortClauses) {
        const comparison = compareNullableValues(
          getFieldValue(leftRecord, sortClause.sortColumn),
          getFieldValue(rightRecord, sortClause.sortColumn),
        );

        if (comparison === 0) {
          continue;
        }

        return sortClause.sortOrder === "desc" ? -comparison : comparison;
      }

      return 0;
    });
  }

  if (takeClause) {
    result = result.slice(0, takeClause.count);
  }

  return result;
};

const createRecord = (
  tableName: string,
  records: MutableRecord[],
  nextId: () => string,
): MutableRecord => {
  const raw: Record<string, unknown> = {
    created_at: 0,
    updated_at: 0,
  };

  const record: MutableRecord = {
    id: nextId(),
    _raw: raw,
    async update(mutator) {
      mutator(record);
    },
    async destroyPermanently() {
      const index = records.indexOf(record);
      if (index >= 0) {
        records.splice(index, 1);
      }
    },
  };

  Object.defineProperty(record, "createdAt", {
    enumerable: true,
    get: () => new Date(Number(raw.created_at ?? 0)),
    set: (value: Date | number) => {
      raw.created_at = value instanceof Date ? value.getTime() : Number(value);
    },
  });

  Object.defineProperty(record, "updatedAt", {
    enumerable: true,
    get: () => new Date(Number(raw.updated_at ?? 0)),
    set: (value: Date | number) => {
      raw.updated_at = value instanceof Date ? value.getTime() : Number(value);
    },
  });

  Object.defineProperty(record, "__tableName", {
    enumerable: false,
    value: tableName,
  });

  return record;
};

export const createInMemoryWatermelonDatabase = (params: {
  allowedTables: readonly string[];
}) => {
  const tableMap = new Map<string, MutableRecord[]>(
    params.allowedTables.map((tableName) => [tableName, []]),
  );
  const localStore = new Map<string, string>();
  let sequence = 0;

  const nextId = (): string => `record-${++sequence}`;

  const database = {
    get: <T>(tableName: string) => {
      const records = tableMap.get(tableName);
      if (!records) {
        throw new Error(`Unexpected table lookup: ${tableName}`);
      }

      return {
        query: (...clauses: readonly QueryClause[]) => ({
          fetch: async () => applyClauses(records, clauses) as T[],
        }),
        create: async (mutator: (record: T) => void) => {
          const record = createRecord(tableName, records, nextId) as unknown as T;
          mutator(record);
          records.push(record as unknown as MutableRecord);
          return record;
        },
      };
    },
    adapter: {
      setLocal: async (key: string, value: string) => {
        localStore.set(key, value);
      },
      getLocal: async (key: string) => localStore.get(key) ?? null,
      removeLocal: async (key: string) => {
        localStore.delete(key);
      },
    },
    write: async <T>(action: () => Promise<T> | T): Promise<T> =>
      Promise.resolve(action()),
    read: async <T>(action: () => Promise<T> | T): Promise<T> =>
      Promise.resolve(action()),
  } as unknown as Database;

  return {
    database,
    snapshotTable: (tableName: string): readonly MutableRecord[] => {
      const records = tableMap.get(tableName);
      if (!records) {
        throw new Error(`Unexpected table snapshot: ${tableName}`);
      }

      return [...records];
    },
  };
};
