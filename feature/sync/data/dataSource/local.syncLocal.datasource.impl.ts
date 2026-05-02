import { SyncConflictStatus, SyncConflictResolutionAction } from "@/shared/sync/types/syncConflict.types";
import { SyncStatus } from "@/shared/sync/types/syncStatus.types";
import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import { SyncCheckpointModel } from "./db/syncCheckpoint.model";
import { SyncConflictModel } from "./db/syncConflict.model";
import { SyncErrorModel } from "./db/syncError.model";
import { SyncOutboxModel } from "./db/syncOutbox.model";
import { SyncRunModel } from "./db/syncRun.model";
import {
  CompleteSyncRunInput,
  CreateSyncRunInput,
  FailSyncRunInput,
  GetPendingRecordsByTableInput,
  QueueOutboxRecordInput,
  RecordSyncConflictInput,
  RecordSyncErrorInput,
  ResolveSyncConflictInput,
  SaveCheckpointInput,
  SyncLocalDatasource,
  UpdateSyncRecordStateInput,
} from "./syncLocal.datasource";
import { getSyncRegistryItem, syncRegistry } from "../../registry/syncRegistry";
import { SyncOutboxStatus, SyncRunStatus } from "../../types/sync.constant";
import {
  SyncCheckpoint,
  SyncConflictRecord,
  SyncErrorRecord,
  SyncOutboxRecord,
  SyncRawRecord,
  SyncRegistryItem,
  SyncRunRecord,
} from "../../types/sync.entity.types";
import { SyncStatusState } from "../../types/sync.state.types";

const SYNC_CHECKPOINTS_TABLE = "sync_checkpoints";
const SYNC_RUNS_TABLE = "sync_runs";
const SYNC_ERRORS_TABLE = "sync_errors";
const SYNC_CONFLICTS_TABLE = "sync_conflicts";
const SYNC_OUTBOX_TABLE = "sync_outbox";

const SQL_IDENTIFIER_REGEX = /^[a-z_]+$/;

type SqlPrimitive = string | number | null;
type RawRow = Record<string, SqlPrimitive>;
type TableInfoRow = {
  name?: string | null;
};

const assertSqlIdentifier = (value: string): string => {
  const normalized = value.trim();
  if (!SQL_IDENTIFIER_REGEX.test(normalized)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }
  return normalized;
};

const quoteIdentifier = (value: string): string => `"${assertSqlIdentifier(value)}"`;

const createRandomId = (prefix: string): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return `${prefix}-${randomId}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const toNullableNumber = (value: unknown): number | null => {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const buildRecordRemoteIdExpression = (
  registryItem: SyncRegistryItem,
  alias: string,
): string => {
  if (registryItem.remoteIdField) {
    return `${alias}.${quoteIdentifier(registryItem.remoteIdField)}`;
  }

  if (registryItem.compositeRemoteIdFields?.length) {
    return registryItem.compositeRemoteIdFields
      .map(
        (fieldName) =>
          `COALESCE(CAST(${alias}.${quoteIdentifier(fieldName)} AS TEXT), '')`,
      )
      .join(` || ':' || `);
  }

  throw new Error(`Table ${registryItem.tableName} has no remote id strategy.`);
};

const buildAccountExpression = (
  registryItem: SyncRegistryItem,
  alias: string,
): string => {
  if (registryItem.scopeJoin) {
    return `parent.${quoteIdentifier(registryItem.scopeJoin.parentScopeField)}`;
  }

  return `${alias}.${quoteIdentifier(registryItem.scopeField)}`;
};

const buildScopeFromClause = (registryItem: SyncRegistryItem): string => {
  const childAlias = "child";
  if (!registryItem.scopeJoin) {
    return `FROM ${quoteIdentifier(registryItem.tableName)} ${childAlias}`;
  }

  const join = registryItem.scopeJoin;
  const parentAlias = "parent";
  return [
    `FROM ${quoteIdentifier(registryItem.tableName)} ${childAlias}`,
    `INNER JOIN ${quoteIdentifier(join.parentTable)} ${parentAlias}`,
    `ON ${parentAlias}.${quoteIdentifier(join.parentJoinField)} = ${childAlias}.${quoteIdentifier(join.childJoinField)}`,
  ].join(" ");
};

const buildScopeWhereClause = (
  registryItem: SyncRegistryItem,
  accountRemoteId: string,
): {
  clause: string;
  args: SqlPrimitive[];
} => {
  if (!registryItem.scopeJoin) {
    return {
      clause: `child.${quoteIdentifier(registryItem.scopeField)} = ?`,
      args: [accountRemoteId],
    };
  }

  const parentAlias = "parent";
  const parentScopeClause = `${parentAlias}.${quoteIdentifier(
    registryItem.scopeJoin.parentScopeField,
  )} = ?`;
  const args: SqlPrimitive[] = [accountRemoteId];

  if (registryItem.scopeJoin.parentDeletedAtField) {
    return {
      clause: `${parentScopeClause} AND ${parentAlias}.${quoteIdentifier(
        registryItem.scopeJoin.parentDeletedAtField,
      )} IS NULL`,
      args,
    };
  }

  return {
    clause: parentScopeClause,
    args,
  };
};

const stripHelperColumns = (row: RawRow): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith("__")) {
      continue;
    }

    payload[key] = value;
  }

  return payload;
};

const mapRawRowToSyncRecord = (
  row: RawRow,
  tableName: string,
): SyncRawRecord => ({
  id: toNullableString(row.id) ?? undefined,
  tableName,
  recordRemoteId: toNullableString(row.__record_remote_id) ?? "",
  accountRemoteId: toNullableString(row.__account_remote_id),
  ownerUserRemoteId: toNullableString(row.__owner_user_remote_id),
  recordSyncStatus: toNullableString(row.__record_sync_status),
  lastSyncedAt: toNullableNumber(row.__last_synced_at),
  deletedAt: toNullableNumber(row.__deleted_at),
  createdAt: toNullableNumber(row.created_at),
  updatedAt: toNullableNumber(row.updated_at),
  payload: stripHelperColumns(row),
});

const mapSyncCheckpointModel = (model: SyncCheckpointModel): SyncCheckpoint => ({
  remoteId: model.remoteId,
  ownerUserRemoteId: model.ownerUserRemoteId,
  accountRemoteId: model.accountRemoteId,
  tableName: model.tableName,
  serverCursor: model.serverCursor,
  lastPulledAt: model.lastPulledAt,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

const mapSyncRunModel = (model: SyncRunModel): SyncRunRecord => ({
  remoteId: model.remoteId,
  ownerUserRemoteId: model.ownerUserRemoteId,
  accountRemoteId: model.accountRemoteId,
  status: model.status,
  startedAt: model.startedAt,
  finishedAt: model.finishedAt,
  pushedCount: model.pushedCount,
  pulledCount: model.pulledCount,
  conflictCount: model.conflictCount,
  failedCount: model.failedCount,
  errorMessage: model.errorMessage,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

const mapSyncErrorModel = (model: SyncErrorModel): SyncErrorRecord => ({
  remoteId: model.remoteId,
  syncRunRemoteId: model.syncRunRemoteId,
  tableName: model.tableName,
  recordRemoteId: model.recordRemoteId,
  operation: model.operation,
  errorType: model.errorType,
  errorMessage: model.errorMessage,
  retryCount: model.retryCount,
  nextRetryAt: model.nextRetryAt,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

const mapSyncConflictModel = (
  model: SyncConflictModel,
): SyncConflictRecord => ({
  remoteId: model.remoteId,
  tableName: model.tableName,
  recordRemoteId: model.recordRemoteId,
  accountRemoteId: model.accountRemoteId,
  localPayloadJson: model.localPayloadJson,
  remotePayloadJson: model.remotePayloadJson,
  conflictPolicy: model.conflictPolicy,
  status: model.status,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

const mapSyncOutboxModel = (model: SyncOutboxModel): SyncOutboxRecord => ({
  remoteId: model.remoteId,
  tableName: model.tableName,
  recordRemoteId: model.recordRemoteId,
  accountRemoteId: model.accountRemoteId,
  operation: model.operation,
  payloadJson: model.payloadJson,
  status: model.status,
  attemptCount: model.attemptCount,
  lastAttemptedAt: model.lastAttemptedAt,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

const legacyFailureStatus = "failed";

export const createLocalSyncLocalDatasource = (
  database: Database,
): SyncLocalDatasource => {
  const tableColumnsCache = new Map<string, Set<string>>();

  const executeSql = async (
    sqls: readonly [string, SqlPrimitive[]][],
  ): Promise<void> => {
    await database.write(async () => {
      await database.adapter.unsafeExecute({ sqls: [...sqls] });
    });
  };

  const fetchRaw = async (
    sql: string,
    args: readonly SqlPrimitive[] = [],
  ): Promise<RawRow[]> => {
    const collection = database.get<SyncOutboxModel>(SYNC_OUTBOX_TABLE);
    return (await collection
      .query(Q.unsafeSqlQuery(sql, [...args]))
      .unsafeFetchRaw()) as RawRow[];
  };

  const getTableColumns = async (tableName: string): Promise<Set<string>> => {
    const normalizedTableName = assertSqlIdentifier(tableName);
    const cached = tableColumnsCache.get(normalizedTableName);
    if (cached) {
      return cached;
    }

    const rows = (await fetchRaw(
      `PRAGMA table_info(${quoteIdentifier(normalizedTableName)})`,
    )) as TableInfoRow[];
    const columns = new Set(
      rows
        .map((row) => row.name?.trim() ?? "")
        .filter((columnName) => columnName.length > 0),
    );
    tableColumnsCache.set(normalizedTableName, columns);
    return columns;
  };

  const buildRecordLookupClause = (
    registryItem: SyncRegistryItem,
    recordRemoteId: string,
  ): {
    clause: string;
    args: SqlPrimitive[];
  } => {
    if (registryItem.remoteIdField) {
      return {
        clause: `child.${quoteIdentifier(registryItem.remoteIdField)} = ?`,
        args: [recordRemoteId],
      };
    }

    if (registryItem.compositeRemoteIdFields?.length) {
      const segments = recordRemoteId.split(":");
      if (segments.length !== registryItem.compositeRemoteIdFields.length) {
        throw new Error(
          `Composite remote id mismatch for table ${registryItem.tableName}.`,
        );
      }

      return {
        clause: registryItem.compositeRemoteIdFields
          .map((fieldName) => `child.${quoteIdentifier(fieldName)} = ?`)
          .join(" AND "),
        args: segments,
      };
    }

    throw new Error(`Table ${registryItem.tableName} cannot resolve remote ids.`);
  };

  const updateBusinessRecordSyncState = async (
    registryItem: SyncRegistryItem,
    recordRemoteId: string,
    nextStatus: string,
    lastSyncedAt: number | null,
  ): Promise<void> => {
    if (!registryItem.syncStatusField) {
      return;
    }

    const columns = await getTableColumns(registryItem.tableName);
    if (!columns.has(registryItem.syncStatusField)) {
      return;
    }

    const lookup = buildRecordLookupClause(registryItem, recordRemoteId);
    const updates: string[] = [
      `${quoteIdentifier(registryItem.syncStatusField)} = ?`,
    ];
    const args: SqlPrimitive[] = [nextStatus];

    if (registryItem.lastSyncedAtField && columns.has(registryItem.lastSyncedAtField)) {
      updates.push(`${quoteIdentifier(registryItem.lastSyncedAtField)} = ?`);
      args.push(lastSyncedAt);
    }

    if (columns.has("updated_at")) {
      updates.push(`${quoteIdentifier("updated_at")} = ?`);
      args.push(Date.now());
    }

    args.push(...lookup.args);

    await executeSql([
      [
        `UPDATE ${quoteIdentifier(registryItem.tableName)} SET ${updates.join(
          ", ",
        )} WHERE ${lookup.clause}`,
        args,
      ],
    ]);
  };

  const updateOutboxState = async ({
    tableName,
    recordRemoteId,
    nextStatus,
    payloadJson,
    operation,
  }: {
    tableName: string;
    recordRemoteId: string;
    nextStatus: string;
    payloadJson?: string;
    operation?: string;
  }): Promise<void> => {
    const collection = database.get<SyncOutboxModel>(SYNC_OUTBOX_TABLE);
    const existing = await collection
      .query(
        Q.where("table_name", tableName),
        Q.where("record_remote_id", recordRemoteId),
      )
      .fetch();
    const now = Date.now();

    if (existing[0]) {
      await database.write(async () => {
        await existing[0].update((record) => {
          record.status = nextStatus as SyncOutboxModel["status"];
          record.attemptCount =
            nextStatus === SyncOutboxStatus.Syncing
              ? record.attemptCount + 1
              : record.attemptCount;
          record.lastAttemptedAt =
            nextStatus === SyncOutboxStatus.Syncing ? now : record.lastAttemptedAt;
          if (payloadJson) {
            record.payloadJson = payloadJson;
          }
          if (operation) {
            record.operation = operation as SyncOutboxModel["operation"];
          }
          (record as unknown as { _raw: Record<string, number> })._raw.updated_at =
            now;
        });
      });
      return;
    }

    if (!payloadJson || !operation) {
      return;
    }

    await database.write(async () => {
      await collection.create((record) => {
        record.remoteId = createRandomId("sync-outbox");
        record.tableName = tableName;
        record.recordRemoteId = recordRemoteId;
        record.accountRemoteId = "";
        record.operation = operation as SyncOutboxModel["operation"];
        record.payloadJson = payloadJson;
        record.status = nextStatus as SyncOutboxModel["status"];
        record.attemptCount = nextStatus === SyncOutboxStatus.Syncing ? 1 : 0;
        record.lastAttemptedAt =
          nextStatus === SyncOutboxStatus.Syncing ? now : null;
        (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
        (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
      });
    });
  };

  const fetchPendingBusinessRows = async (
    input: GetPendingRecordsByTableInput,
  ): Promise<SyncRawRecord[]> => {
    const columns = await getTableColumns(input.registryItem.tableName);
    const statuses = input.includeFailed
      ? [
          SyncStatus.PendingCreate,
          SyncStatus.PendingUpdate,
          SyncStatus.PendingDelete,
          "pending",
          legacyFailureStatus,
        ]
      : [
          SyncStatus.PendingCreate,
          SyncStatus.PendingUpdate,
          SyncStatus.PendingDelete,
          "pending",
        ];
    const fromClause = buildScopeFromClause(input.registryItem);
    const scopeWhere = buildScopeWhereClause(
      input.registryItem,
      input.accountRemoteId,
    );
    const childOwnerExpression = columns.has("owner_user_remote_id")
      ? "child.owner_user_remote_id"
      : "NULL";
    const sql = [
      "SELECT",
      "child.*,",
      `${buildRecordRemoteIdExpression(input.registryItem, "child")} AS __record_remote_id,`,
      `${buildAccountExpression(input.registryItem, "child")} AS __account_remote_id,`,
      `${childOwnerExpression} AS __owner_user_remote_id,`,
      `child.${quoteIdentifier(input.registryItem.syncStatusField ?? "sync_status")} AS __record_sync_status,`,
      input.registryItem.lastSyncedAtField
        ? `child.${quoteIdentifier(input.registryItem.lastSyncedAtField)} AS __last_synced_at,`
        : "NULL AS __last_synced_at,",
      input.registryItem.deletedAtField
        ? `child.${quoteIdentifier(input.registryItem.deletedAtField)} AS __deleted_at`
        : "NULL AS __deleted_at",
      fromClause,
      `WHERE ${scopeWhere.clause}`,
      `AND child.${quoteIdentifier(input.registryItem.syncStatusField!)} IN (${statuses
        .map(() => "?")
        .join(", ")})`,
      "ORDER BY child.updated_at ASC",
      `LIMIT ${input.limit ?? 100}`,
    ].join(" ");

    const rows = await fetchRaw(sql, [...scopeWhere.args, ...statuses]);
    return rows.map((row) => mapRawRowToSyncRecord(row, input.registryItem.tableName));
  };

  const fetchPendingOutboxRows = async (
    input: GetPendingRecordsByTableInput,
  ): Promise<SyncRawRecord[]> => {
    const statuses = input.includeFailed
      ? [SyncOutboxStatus.Pending, SyncOutboxStatus.Failed]
      : [SyncOutboxStatus.Pending];
    const sql = [
      "SELECT",
      `${quoteIdentifier("id")} AS id,`,
      `${quoteIdentifier("record_remote_id")} AS __record_remote_id,`,
      `${quoteIdentifier("account_remote_id")} AS __account_remote_id,`,
      "NULL AS __owner_user_remote_id,",
      `${quoteIdentifier("status")} AS __record_sync_status,`,
      "NULL AS __last_synced_at,",
      "NULL AS __deleted_at,",
      `${quoteIdentifier("created_at")} AS created_at,`,
      `${quoteIdentifier("updated_at")} AS updated_at,`,
      `${quoteIdentifier("payload_json")} AS payload_json`,
      `FROM ${quoteIdentifier(SYNC_OUTBOX_TABLE)}`,
      `WHERE ${quoteIdentifier("table_name")} = ?`,
      `AND ${quoteIdentifier("account_remote_id")} = ?`,
      `AND ${quoteIdentifier("status")} IN (${statuses.map(() => "?").join(", ")})`,
      "ORDER BY updated_at ASC",
      `LIMIT ${input.limit ?? 100}`,
    ].join(" ");
    const rows = await fetchRaw(sql, [
      input.registryItem.tableName,
      input.accountRemoteId,
      ...statuses,
    ]);

    return rows.map((row) => ({
      id: toNullableString(row.id) ?? undefined,
      tableName: input.registryItem.tableName,
      recordRemoteId: toNullableString(row.__record_remote_id) ?? "",
      accountRemoteId: toNullableString(row.__account_remote_id),
      ownerUserRemoteId: null,
      recordSyncStatus: toNullableString(row.__record_sync_status),
      lastSyncedAt: null,
      deletedAt: null,
      createdAt: toNullableNumber(row.created_at),
      updatedAt: toNullableNumber(row.updated_at),
      payload: JSON.parse(toNullableString(row.payload_json) ?? "{}") as Record<
        string,
        unknown
      >,
    }));
  };

  const getDirectRecordByRemoteId = async (
    registryItem: SyncRegistryItem,
    recordRemoteId: string,
    accountRemoteId: string,
  ): Promise<SyncRawRecord | null> => {
    if (!registryItem.remoteIdField && !registryItem.compositeRemoteIdFields?.length) {
      return null;
    }

    const fromClause = buildScopeFromClause(registryItem);
    const scopeWhere = buildScopeWhereClause(registryItem, accountRemoteId);
    const recordWhere = buildRecordLookupClause(registryItem, recordRemoteId);
    const sql = [
      "SELECT",
      "child.*,",
      `${buildRecordRemoteIdExpression(registryItem, "child")} AS __record_remote_id,`,
      `${buildAccountExpression(registryItem, "child")} AS __account_remote_id,`,
      "NULL AS __owner_user_remote_id,",
      registryItem.syncStatusField
        ? `child.${quoteIdentifier(registryItem.syncStatusField)} AS __record_sync_status,`
        : "NULL AS __record_sync_status,",
      registryItem.lastSyncedAtField
        ? `child.${quoteIdentifier(registryItem.lastSyncedAtField)} AS __last_synced_at,`
        : "NULL AS __last_synced_at,",
      registryItem.deletedAtField
        ? `child.${quoteIdentifier(registryItem.deletedAtField)} AS __deleted_at`
        : "NULL AS __deleted_at",
      fromClause,
      `WHERE ${scopeWhere.clause}`,
      `AND ${recordWhere.clause}`,
      "LIMIT 1",
    ].join(" ");
    const rows = await fetchRaw(sql, [...scopeWhere.args, ...recordWhere.args]);
    const row = rows[0];
    return row ? mapRawRowToSyncRecord(row, registryItem.tableName) : null;
  };

  return {
    async getPendingRecordsByTable(
      input: GetPendingRecordsByTableInput,
    ): Promise<Result<SyncRawRecord[]>> {
      try {
        const records = input.registryItem.syncStatusField
          ? await fetchPendingBusinessRows(input)
          : await fetchPendingOutboxRows(input);

        return {
          success: true,
          value: records,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async getLocalRecord(
      registryItem: SyncRegistryItem,
      recordRemoteId: string,
      accountRemoteId: string,
    ): Promise<Result<SyncRawRecord | null>> {
      try {
        const value = await getDirectRecordByRemoteId(
          registryItem,
          recordRemoteId,
          accountRemoteId,
        );

        return {
          success: true,
          value,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async upsertPulledRecord(
      registryItem,
      recordRemoteId,
      payload,
    ): Promise<Result<SyncRawRecord>> {
      try {
        const columns = await getTableColumns(registryItem.tableName);
        const sanitizedPayload = Object.fromEntries(
          Object.entries(payload).filter(([key, value]) => {
            if (value === undefined) {
              return false;
            }
            return columns.has(key) && key !== "id";
          }),
        );
        const now = Date.now();

        if (registryItem.syncStatusField && columns.has(registryItem.syncStatusField)) {
          sanitizedPayload[registryItem.syncStatusField] = SyncStatus.Synced;
        }
        if (
          registryItem.lastSyncedAtField &&
          columns.has(registryItem.lastSyncedAtField)
        ) {
          sanitizedPayload[registryItem.lastSyncedAtField] = now;
        }
        if (
          registryItem.deletedAtField &&
          columns.has(registryItem.deletedAtField) &&
          !(registryItem.deletedAtField in sanitizedPayload)
        ) {
          sanitizedPayload[registryItem.deletedAtField] = null;
        }
        if (columns.has("updated_at") && !("updated_at" in sanitizedPayload)) {
          sanitizedPayload.updated_at = now;
        }
        if (columns.has("created_at") && !("created_at" in sanitizedPayload)) {
          sanitizedPayload.created_at = now;
        }

        const existing = await getDirectRecordByRemoteId(
          registryItem,
          recordRemoteId,
          toNullableString(
            payload.account_remote_id ??
              payload.business_account_remote_id ??
              payload.scope_account_remote_id ??
              payload.account_remote_id,
          ) ?? "",
        );

        if (existing?.id) {
          const updateColumns = Object.keys(sanitizedPayload);
          const sql = `UPDATE ${quoteIdentifier(registryItem.tableName)} SET ${updateColumns
            .map((columnName) => `${quoteIdentifier(columnName)} = ?`)
            .join(", ")} WHERE ${quoteIdentifier("id")} = ?`;
          await executeSql([
            [
              sql,
              [
                ...updateColumns.map(
                  (columnName) => sanitizedPayload[columnName] as SqlPrimitive,
                ),
                existing.id,
              ],
            ],
          ]);
        } else {
          const localId = createRandomId(`local-${registryItem.tableName}`);
          const insertColumns = ["id", ...Object.keys(sanitizedPayload)];
          const sql = `INSERT INTO ${quoteIdentifier(registryItem.tableName)} (${insertColumns
            .map(quoteIdentifier)
            .join(", ")}) VALUES (${insertColumns.map(() => "?").join(", ")})`;
          await executeSql([
            [
              sql,
              [
                localId,
                ...insertColumns
                  .slice(1)
                  .map((columnName) => sanitizedPayload[columnName] as SqlPrimitive),
              ],
            ],
          ]);
        }

        const accountRemoteId =
          toNullableString(
            payload.account_remote_id ??
              payload.business_account_remote_id ??
              payload.scope_account_remote_id,
          ) ?? "";
        const refreshed = await getDirectRecordByRemoteId(
          registryItem,
          recordRemoteId,
          accountRemoteId,
        );

        if (!refreshed) {
          throw new Error(
            `Unable to reload ${registryItem.tableName} after sync apply.`,
          );
        }

        return {
          success: true,
          value: refreshed,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async tombstoneRecord(
      registryItem,
      recordRemoteId,
      deletedAt,
    ): Promise<Result<boolean>> {
      try {
        if (!registryItem.deletedAtField) {
          return { success: true, value: true };
        }

        const lookup = buildRecordLookupClause(registryItem, recordRemoteId);
        const updates = [
          `${quoteIdentifier(registryItem.deletedAtField)} = ?`,
          registryItem.syncStatusField
            ? `${quoteIdentifier(registryItem.syncStatusField)} = ?`
            : null,
          registryItem.lastSyncedAtField
            ? `${quoteIdentifier(registryItem.lastSyncedAtField)} = ?`
            : null,
          `${quoteIdentifier("updated_at")} = ?`,
        ].filter(Boolean) as string[];

        const args: SqlPrimitive[] = [deletedAt];
        if (registryItem.syncStatusField) {
          args.push(SyncStatus.Synced);
        }
        if (registryItem.lastSyncedAtField) {
          args.push(Date.now());
        }
        args.push(Date.now(), ...lookup.args);

        await executeSql([
          [
            `UPDATE ${quoteIdentifier(registryItem.tableName)} SET ${updates.join(
              ", ",
            )} WHERE ${lookup.clause}`,
            args,
          ],
        ]);

        return {
          success: true,
          value: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async queueOutboxRecord(
      input: QueueOutboxRecordInput,
    ): Promise<Result<SyncOutboxRecord>> {
      try {
        const collection = database.get<SyncOutboxModel>(SYNC_OUTBOX_TABLE);
        const existing = await collection
          .query(
            Q.where("table_name", input.tableName),
            Q.where("record_remote_id", input.recordRemoteId),
          )
          .fetch();
        const now = Date.now();
        const payloadJson = JSON.stringify(input.payload);

        if (existing[0]) {
          await database.write(async () => {
            await existing[0].update((record) => {
              record.accountRemoteId = input.accountRemoteId;
              record.operation = input.operation;
              record.payloadJson = payloadJson;
              record.status = SyncOutboxStatus.Pending;
              (record as unknown as { _raw: Record<string, number> })._raw.updated_at =
                now;
            });
          });

          return {
            success: true,
            value: mapSyncOutboxModel(existing[0]),
          };
        }

        let created!: SyncOutboxModel;
        await database.write(async () => {
          created = await collection.create((record) => {
            record.remoteId = createRandomId("sync-outbox");
            record.tableName = input.tableName;
            record.recordRemoteId = input.recordRemoteId;
            record.accountRemoteId = input.accountRemoteId;
            record.operation = input.operation;
            record.payloadJson = payloadJson;
            record.status = SyncOutboxStatus.Pending;
            record.attemptCount = 0;
            record.lastAttemptedAt = null;
            (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
            (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
          });
        });

        return {
          success: true,
          value: mapSyncOutboxModel(created),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async markRecordSyncing(
      input: UpdateSyncRecordStateInput,
    ): Promise<Result<boolean>> {
      try {
        await updateBusinessRecordSyncState(
          input.registryItem,
          input.recordRemoteId,
          SyncStatus.Syncing,
          input.lastSyncedAt ?? null,
        );
        await updateOutboxState({
          tableName: input.registryItem.tableName,
          recordRemoteId: input.recordRemoteId,
          nextStatus: SyncOutboxStatus.Syncing,
        });
        return { success: true, value: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async markRecordSynced(
      input: UpdateSyncRecordStateInput,
    ): Promise<Result<boolean>> {
      try {
        await updateBusinessRecordSyncState(
          input.registryItem,
          input.recordRemoteId,
          SyncStatus.Synced,
          input.lastSyncedAt ?? Date.now(),
        );
        await updateOutboxState({
          tableName: input.registryItem.tableName,
          recordRemoteId: input.recordRemoteId,
          nextStatus: SyncOutboxStatus.Synced,
        });
        return { success: true, value: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async markRecordSyncFailed(
      input: UpdateSyncRecordStateInput,
    ): Promise<Result<boolean>> {
      try {
        await updateBusinessRecordSyncState(
          input.registryItem,
          input.recordRemoteId,
          legacyFailureStatus,
          input.lastSyncedAt ?? null,
        );
        await updateOutboxState({
          tableName: input.registryItem.tableName,
          recordRemoteId: input.recordRemoteId,
          nextStatus: SyncOutboxStatus.Failed,
        });
        return { success: true, value: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async markRecordConflict(
      input: UpdateSyncRecordStateInput,
    ): Promise<Result<boolean>> {
      try {
        await updateBusinessRecordSyncState(
          input.registryItem,
          input.recordRemoteId,
          SyncStatus.Conflict,
          input.lastSyncedAt ?? null,
        );
        await updateOutboxState({
          tableName: input.registryItem.tableName,
          recordRemoteId: input.recordRemoteId,
          nextStatus: SyncOutboxStatus.Conflict,
        });
        return { success: true, value: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async getCheckpoint(scope, tableName): Promise<Result<SyncCheckpoint | null>> {
      try {
        const collection = database.get<SyncCheckpointModel>(SYNC_CHECKPOINTS_TABLE);
        const matching = await collection
          .query(
            Q.where("owner_user_remote_id", scope.ownerUserRemoteId),
            Q.where("account_remote_id", scope.accountRemoteId),
            Q.where("table_name", tableName),
          )
          .fetch();

        return {
          success: true,
          value: matching[0] ? mapSyncCheckpointModel(matching[0]) : null,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async saveCheckpoint(input: SaveCheckpointInput): Promise<Result<SyncCheckpoint>> {
      try {
        const collection = database.get<SyncCheckpointModel>(SYNC_CHECKPOINTS_TABLE);
        const existing = await collection
          .query(
            Q.where("owner_user_remote_id", input.ownerUserRemoteId),
            Q.where("account_remote_id", input.accountRemoteId),
            Q.where("table_name", input.tableName),
          )
          .fetch();

        if (existing[0]) {
          await database.write(async () => {
            await existing[0].update((record) => {
              record.serverCursor = input.serverCursor;
              record.lastPulledAt = input.lastPulledAt;
              (record as unknown as { _raw: Record<string, number> })._raw.updated_at =
                Date.now();
            });
          });

          return {
            success: true,
            value: mapSyncCheckpointModel(existing[0]),
          };
        }

        let created!: SyncCheckpointModel;
        await database.write(async () => {
          created = await collection.create((record) => {
            const now = Date.now();
            record.remoteId = createRandomId("sync-checkpoint");
            record.ownerUserRemoteId = input.ownerUserRemoteId;
            record.accountRemoteId = input.accountRemoteId;
            record.tableName = input.tableName;
            record.serverCursor = input.serverCursor;
            record.lastPulledAt = input.lastPulledAt;
            (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
            (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
          });
        });

        return {
          success: true,
          value: mapSyncCheckpointModel(created),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async createSyncRun(input: CreateSyncRunInput): Promise<Result<SyncRunRecord>> {
      try {
        const collection = database.get<SyncRunModel>(SYNC_RUNS_TABLE);
        let created!: SyncRunModel;
        await database.write(async () => {
          created = await collection.create((record) => {
            const now = Date.now();
            record.remoteId = createRandomId("sync-run");
            record.ownerUserRemoteId = input.ownerUserRemoteId;
            record.accountRemoteId = input.accountRemoteId;
            record.status = SyncRunStatus.Running;
            record.startedAt = input.startedAt;
            record.finishedAt = null;
            record.pushedCount = 0;
            record.pulledCount = 0;
            record.conflictCount = 0;
            record.failedCount = 0;
            record.errorMessage = null;
            (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
            (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
          });
        });

        return {
          success: true,
          value: mapSyncRunModel(created),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async completeSyncRun(
      input: CompleteSyncRunInput,
    ): Promise<Result<SyncRunRecord>> {
      try {
        const collection = database.get<SyncRunModel>(SYNC_RUNS_TABLE);
        const matching = await collection
          .query(Q.where("remote_id", input.syncRunRemoteId))
          .fetch();
        const run = matching[0];
        if (!run) {
          throw new Error(`Sync run ${input.syncRunRemoteId} not found.`);
        }

        await database.write(async () => {
          await run.update((record) => {
            record.status = SyncRunStatus.Completed;
            record.finishedAt = input.finishedAt;
            record.pushedCount = input.pushedCount;
            record.pulledCount = input.pulledCount;
            record.conflictCount = input.conflictCount;
            record.failedCount = input.failedCount;
            record.errorMessage = null;
            (record as unknown as { _raw: Record<string, number> })._raw.updated_at =
              Date.now();
          });
        });

        return { success: true, value: mapSyncRunModel(run) };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async failSyncRun(input: FailSyncRunInput): Promise<Result<SyncRunRecord>> {
      try {
        const collection = database.get<SyncRunModel>(SYNC_RUNS_TABLE);
        const matching = await collection
          .query(Q.where("remote_id", input.syncRunRemoteId))
          .fetch();
        const run = matching[0];
        if (!run) {
          throw new Error(`Sync run ${input.syncRunRemoteId} not found.`);
        }

        await database.write(async () => {
          await run.update((record) => {
            record.status = SyncRunStatus.Failed;
            record.finishedAt = input.finishedAt;
            record.pushedCount = input.pushedCount;
            record.pulledCount = input.pulledCount;
            record.conflictCount = input.conflictCount;
            record.failedCount = input.failedCount;
            record.errorMessage = input.errorMessage;
            (record as unknown as { _raw: Record<string, number> })._raw.updated_at =
              Date.now();
          });
        });

        return { success: true, value: mapSyncRunModel(run) };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async recordSyncError(
      input: RecordSyncErrorInput,
    ): Promise<Result<SyncErrorRecord>> {
      try {
        const collection = database.get<SyncErrorModel>(SYNC_ERRORS_TABLE);
        let created!: SyncErrorModel;
        await database.write(async () => {
          created = await collection.create((record) => {
            const now = Date.now();
            record.remoteId = createRandomId("sync-error");
            record.syncRunRemoteId = input.syncRunRemoteId;
            record.tableName = input.tableName;
            record.recordRemoteId = input.recordRemoteId;
            record.operation = input.operation;
            record.errorType = input.errorType;
            record.errorMessage = input.errorMessage;
            record.retryCount = input.retryCount ?? 0;
            record.nextRetryAt = input.nextRetryAt ?? null;
            (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
            (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
          });
        });

        return {
          success: true,
          value: mapSyncErrorModel(created),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async recordSyncConflict(
      input: RecordSyncConflictInput,
    ): Promise<Result<SyncConflictRecord>> {
      try {
        const collection = database.get<SyncConflictModel>(SYNC_CONFLICTS_TABLE);
        let created!: SyncConflictModel;
        await database.write(async () => {
          created = await collection.create((record) => {
            const now = Date.now();
            record.remoteId = createRandomId("sync-conflict");
            record.tableName = input.tableName;
            record.recordRemoteId = input.recordRemoteId;
            record.accountRemoteId = input.accountRemoteId;
            record.localPayloadJson = input.localPayloadJson;
            record.remotePayloadJson = input.remotePayloadJson;
            record.conflictPolicy = input.conflictPolicy;
            record.status = SyncConflictStatus.Open;
            (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
            (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
          });
        });

        return {
          success: true,
          value: mapSyncConflictModel(created),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async listOpenConflicts(
      accountRemoteId: string,
    ): Promise<Result<SyncConflictRecord[]>> {
      try {
        const collection = database.get<SyncConflictModel>(SYNC_CONFLICTS_TABLE);
        const conflicts = await collection
          .query(
            Q.where("account_remote_id", accountRemoteId),
            Q.where("status", SyncConflictStatus.Open),
          )
          .fetch();

        return {
          success: true,
          value: conflicts.map(mapSyncConflictModel),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async resolveConflict(
      input: ResolveSyncConflictInput,
    ): Promise<Result<boolean>> {
      try {
        const collection = database.get<SyncConflictModel>(SYNC_CONFLICTS_TABLE);
        const matching = await collection
          .query(Q.where("remote_id", input.conflictRemoteId))
          .fetch();
        const conflict = matching[0];
        if (!conflict) {
          throw new Error(`Sync conflict ${input.conflictRemoteId} not found.`);
        }

        const nextStatus =
          input.nextStatus ??
          (input.resolutionAction === SyncConflictResolutionAction.UseLocal
            ? SyncConflictStatus.ResolvedLocal
            : input.resolutionAction === SyncConflictResolutionAction.UseServer
              ? SyncConflictStatus.ResolvedServer
              : input.resolutionAction === SyncConflictResolutionAction.KeepBoth
                ? SyncConflictStatus.ResolvedKeepBoth
                : SyncConflictStatus.ManualFixed);

        await database.write(async () => {
          await conflict.update((record) => {
            record.status = nextStatus;
            (record as unknown as { _raw: Record<string, number> })._raw.updated_at =
              Date.now();
          });
        });

        return { success: true, value: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async getSyncStatusSummary(scope): Promise<Result<SyncStatusState>> {
      try {
        let pendingChangesCount = 0;
        let failedRecordsCount = 0;

        for (const registryItem of syncRegistry) {
          if (registryItem.syncStatusField) {
            const pendingRecords = await fetchPendingBusinessRows({
              ...scope,
              registryItem,
              includeFailed: false,
              limit: 10_000,
            });
            pendingChangesCount += pendingRecords.length;

            const failedRecords = await fetchPendingBusinessRows({
              ...scope,
              registryItem,
              includeFailed: true,
              limit: 10_000,
            });
            failedRecordsCount += failedRecords.filter(
              (record) => record.recordSyncStatus === legacyFailureStatus,
            ).length;
            continue;
          }

          const pendingOutbox = await fetchPendingOutboxRows({
            ...scope,
            registryItem,
            includeFailed: false,
            limit: 10_000,
          });
          pendingChangesCount += pendingOutbox.length;

          const failedOutbox = await fetchPendingOutboxRows({
            ...scope,
            registryItem,
            includeFailed: true,
            limit: 10_000,
          });
          failedRecordsCount += failedOutbox.filter(
            (record) => record.recordSyncStatus === SyncOutboxStatus.Failed,
          ).length;
        }

        const openConflictsResult = await this.listOpenConflicts(scope.accountRemoteId);
        if (!openConflictsResult.success) {
          return openConflictsResult;
        }

        const latestRunResult = await this.getLatestCompletedSyncRun(scope);
        if (!latestRunResult.success) {
          return latestRunResult;
        }

        const runningCollection = database.get<SyncRunModel>(SYNC_RUNS_TABLE);
        const running = await runningCollection
          .query(
            Q.where("owner_user_remote_id", scope.ownerUserRemoteId),
            Q.where("account_remote_id", scope.accountRemoteId),
            Q.where("status", SyncRunStatus.Running),
          )
          .fetchCount();

        return {
          success: true,
          value: {
            lastSyncedAt: latestRunResult.value?.finishedAt ?? null,
            pendingChangesCount,
            failedRecordsCount,
            conflictCount: openConflictsResult.value.length,
            isRunning: running > 0,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },

    async getLatestCompletedSyncRun(
      scope,
    ): Promise<Result<SyncRunRecord | null>> {
      try {
        const collection = database.get<SyncRunModel>(SYNC_RUNS_TABLE);
        const matching = await collection
          .query(
            Q.where("owner_user_remote_id", scope.ownerUserRemoteId),
            Q.where("account_remote_id", scope.accountRemoteId),
            Q.where("status", SyncRunStatus.Completed),
            Q.sortBy("finished_at", Q.desc),
            Q.take(1),
          )
          .fetch();

        return {
          success: true,
          value: matching[0] ? mapSyncRunModel(matching[0]) : null,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    },
  };
};
