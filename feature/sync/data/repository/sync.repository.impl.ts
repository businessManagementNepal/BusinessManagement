import { SyncConflictResolutionActionValue } from "@/shared/sync/types/syncConflict.types";
import {
  SyncOperation,
  SyncOperationValue,
} from "@/shared/sync/types/syncOperation.types";
import { SyncResult } from "@/shared/sync/types/syncResult.types";
import { SyncScope } from "@/shared/sync/types/syncScope.types";
import {
  isPendingSyncStatus,
  normalizeSyncStatus,
  SyncStatus,
} from "@/shared/sync/types/syncStatus.types";
import { PullChangesResponseDto, PushChangesResponseDto } from "../../types/sync.dto.types";
import { SyncApplySummary, SyncStatusState } from "../../types/sync.state.types";
import {
  SyncChangeSetDto,
  SyncRecordAckDto,
} from "../../types/sync.dto.types";
import { SyncConflictRecord, SyncRawRecord, SyncRunRecord } from "../../types/sync.entity.types";
import {
  getConflictPolicyForTable,
  getSyncDependencyRank,
  getSyncRegistryItem,
} from "../../registry/syncRegistry";
import {
  SyncLocalDatasource,
  UpdateSyncRecordStateInput,
} from "../dataSource/syncLocal.datasource";
import { SyncRemoteDatasource } from "../dataSource/syncRemote.datasource";
import { SyncRepository } from "./sync.repository";

const stringifyStable = (value: unknown): string => {
  return JSON.stringify(value);
};

const sanitizePayloadForPull = (
  tableName: string,
  payload: Record<string, unknown>,
): Record<string, unknown> => {
  const registryItem = getSyncRegistryItem(tableName);
  if (!registryItem) {
    return payload;
  }

  if (!registryItem.ignoredPullFields?.length) {
    return { ...payload };
  }

  return Object.fromEntries(
    Object.entries(payload).filter(
      ([key]) => !registryItem.ignoredPullFields?.includes(key),
    ),
  );
};

const selectFields = (
  payload: Record<string, unknown>,
  fieldNames: readonly string[],
): Record<string, unknown> => {
  return Object.fromEntries(
    fieldNames
      .filter((fieldName) => fieldName in payload)
      .map((fieldName) => [fieldName, payload[fieldName]]),
  );
};

const hasProtectedFieldDiff = (
  localPayload: Record<string, unknown>,
  remotePayload: Record<string, unknown>,
  protectedFields: readonly string[] | undefined,
): boolean => {
  if (!protectedFields?.length) {
    return false;
  }

  return protectedFields.some((fieldName) => {
    return stringifyStable(localPayload[fieldName]) !== stringifyStable(remotePayload[fieldName]);
  });
};

const resolvePushOperation = (record: SyncRawRecord): SyncOperationValue => {
  const normalized = normalizeSyncStatus(record.recordSyncStatus);
  if (normalized === SyncStatus.PendingDelete || record.deletedAt !== null) {
    return SyncOperation.Delete;
  }

  if (
    normalized === SyncStatus.PendingCreate ||
    record.lastSyncedAt === null
  ) {
    return SyncOperation.Create;
  }

  return SyncOperation.Update;
};

const buildStateInput = ({
  registryItem,
  recordRemoteId,
  accountRemoteId,
}: {
  registryItem: NonNullable<ReturnType<typeof getSyncRegistryItem>>;
  recordRemoteId: string;
  accountRemoteId: string;
}): UpdateSyncRecordStateInput => ({
  registryItem,
  recordRemoteId,
  accountRemoteId,
  lastSyncedAt: Date.now(),
});

const isFinancialConflict = (
  tableName: string,
  localPayload: Record<string, unknown>,
  remotePayload: Record<string, unknown>,
): boolean => {
  const registryItem = getSyncRegistryItem(tableName);
  if (!registryItem?.isFinancialRecord) {
    return false;
  }

  if (tableName === "billing_documents") {
    const localStatus = String(localPayload.status ?? "");
    const remoteStatus = String(remotePayload.status ?? "");
    if (localStatus === "draft" && remoteStatus === "draft") {
      return false;
    }
  }

  return hasProtectedFieldDiff(
    localPayload,
    remotePayload,
    registryItem.protectedFields,
  );
};

const isWorkflowConflict = (
  tableName: string,
  localPayload: Record<string, unknown>,
  remotePayload: Record<string, unknown>,
): boolean => {
  const registryItem = getSyncRegistryItem(tableName);
  if (!registryItem?.isWorkflowAggregate) {
    return false;
  }

  if (tableName === "pos_sales") {
    const localStatus = String(localPayload.workflow_status ?? "");
    if (
      registryItem.terminalStatuses?.includes(localStatus) &&
      hasProtectedFieldDiff(
        localPayload,
        remotePayload,
        registryItem.protectedFields,
      )
    ) {
      return true;
    }
  }

  if (tableName === "orders") {
    const localStatus = String(localPayload.status ?? "");
    const remoteStatus = String(remotePayload.status ?? "");
    if (
      registryItem.terminalStatuses?.includes(localStatus) &&
      localStatus !== remoteStatus
    ) {
      return true;
    }

    if (
      localStatus !== "draft" &&
      hasProtectedFieldDiff(
        localPayload,
        remotePayload,
        registryItem.protectedFields,
      )
    ) {
      return true;
    }
  }

  if (tableName === "inventory_movements") {
    return hasProtectedFieldDiff(
      localPayload,
      remotePayload,
      registryItem.protectedFields,
    );
  }

  return false;
};

export const createSyncRepository = (
  localDatasource: SyncLocalDatasource,
  remoteDatasource: SyncRemoteDatasource,
): SyncRepository => ({
  async getSyncStatus(scope: SyncScope): Promise<SyncResult<SyncStatusState>> {
    return localDatasource.getSyncStatusSummary(scope);
  },

  async createSyncRun(
    scope: SyncScope,
    startedAt: number,
  ): Promise<SyncResult<SyncRunRecord>> {
    return localDatasource.createSyncRun({
      ...scope,
      startedAt,
    });
  },

  async completeSyncRun(syncRunRemoteId, counts, finishedAt) {
    return localDatasource.completeSyncRun({
      syncRunRemoteId,
      ...counts,
      finishedAt,
    });
  },

  async failSyncRun(syncRunRemoteId, counts, finishedAt, errorMessage) {
    return localDatasource.failSyncRun({
      syncRunRemoteId,
      ...counts,
      finishedAt,
      errorMessage,
    });
  },

  async getPendingChangeSet(
    scope: SyncScope,
    tableName: string,
  ): Promise<SyncResult<SyncChangeSetDto[]>> {
    const registryItem = getSyncRegistryItem(tableName);
    if (!registryItem) {
      return {
        success: false,
        error: new Error(`Sync registry missing table ${tableName}.`),
      };
    }

    const recordsResult = await localDatasource.getPendingRecordsByTable({
      ...scope,
      registryItem,
      includeFailed: true,
    });

    if (!recordsResult.success) {
      return recordsResult;
    }

    const changes: SyncChangeSetDto[] = [];

    for (const record of recordsResult.value) {
      const operation = resolvePushOperation(record);
      const outboxResult = await localDatasource.queueOutboxRecord({
        tableName,
        recordRemoteId: record.recordRemoteId,
        accountRemoteId: scope.accountRemoteId,
        operation,
        payload: record.payload,
      });

      if (!outboxResult.success) {
        return outboxResult;
      }

      changes.push({
        tableName,
        operation,
        recordRemoteId: record.recordRemoteId,
        payload: record.payload,
        serverRevision: null,
        changedAt: record.updatedAt ?? Date.now(),
      });
    }

    return {
      success: true,
      value: changes,
    };
  },

  async pushChanges(input): Promise<SyncResult<PushChangesResponseDto>> {
    try {
      return {
        success: true,
        value: await remoteDatasource.pushChanges(input),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async applyPushAcknowledgements(
    scope: SyncScope,
    syncRunRemoteId: string,
    acknowledgements: readonly SyncRecordAckDto[],
  ) {
    let pushedCount = 0;
    let conflictCount = 0;
    let failedCount = 0;

    for (const acknowledgement of acknowledgements) {
      const registryItem = getSyncRegistryItem(acknowledgement.tableName);
      if (!registryItem) {
        return {
          success: false,
          error: new Error(
            `Sync registry missing table ${acknowledgement.tableName}.`,
          ),
        } satisfies SyncResult<{
          pushedCount: number;
          conflictCount: number;
          failedCount: number;
        }>;
      }

      const stateInput = buildStateInput({
        registryItem,
        recordRemoteId: acknowledgement.recordRemoteId,
        accountRemoteId: scope.accountRemoteId,
      });

      if (acknowledgement.status === "accepted") {
        const result = await localDatasource.markRecordSynced(stateInput);
        if (!result.success) {
          return result;
        }
        pushedCount += 1;
        continue;
      }

      if (acknowledgement.status === "conflict") {
        const localRecordResult = await localDatasource.getLocalRecord(
          registryItem,
          acknowledgement.recordRemoteId,
          scope.accountRemoteId,
        );
        if (!localRecordResult.success) {
          return localRecordResult;
        }

        const markConflictResult = await localDatasource.markRecordConflict(
          stateInput,
        );
        if (!markConflictResult.success) {
          return markConflictResult;
        }

        const conflictResult = await localDatasource.recordSyncConflict({
          tableName: acknowledgement.tableName,
          recordRemoteId: acknowledgement.recordRemoteId,
          accountRemoteId: scope.accountRemoteId,
          localPayloadJson: JSON.stringify(localRecordResult.value?.payload ?? {}),
          remotePayloadJson: JSON.stringify(acknowledgement),
          conflictPolicy:
            acknowledgement.conflictPolicy ??
            getConflictPolicyForTable(acknowledgement.tableName),
        });
        if (!conflictResult.success) {
          return conflictResult;
        }

        conflictCount += 1;
        continue;
      }

      const failedResult = await localDatasource.markRecordSyncFailed(stateInput);
      if (!failedResult.success) {
        return failedResult;
      }

      const errorResult = await localDatasource.recordSyncError({
        syncRunRemoteId,
        tableName: acknowledgement.tableName,
        recordRemoteId: acknowledgement.recordRemoteId,
        operation: SyncOperation.Update,
        errorType: acknowledgement.errorCode ?? "REMOTE_REJECTED",
        errorMessage:
          acknowledgement.errorMessage ?? "Remote sync rejected this record.",
      });
      if (!errorResult.success) {
        return errorResult;
      }

      failedCount += 1;
    }

    return {
      success: true,
      value: {
        pushedCount,
        conflictCount,
        failedCount,
      },
    };
  },

  async getPullRequest(scope: SyncScope) {
    const cursors = [];
    for (const tableName of [
      ...new Set(syncRegistryTablesOrdered()),
    ]) {
      const checkpointResult = await localDatasource.getCheckpoint(scope, tableName);
      if (!checkpointResult.success) {
        return checkpointResult;
      }

      cursors.push({
        tableName,
        serverCursor: checkpointResult.value?.serverCursor ?? null,
      });
    }

    return {
      success: true,
      value: {
        ...scope,
        cursors,
      },
    };
  },

  async pullChanges(input) {
    try {
      return {
        success: true,
        value: await remoteDatasource.pullChanges(input),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async applyPulledChanges(
    scope: SyncScope,
    response: PullChangesResponseDto,
  ): Promise<SyncResult<SyncApplySummary>> {
    const orderedTables = [...response.tables].sort(
      (left, right) =>
        getSyncDependencyRank(left.tableName) -
        getSyncDependencyRank(right.tableName),
    );

    const summary: SyncApplySummary = {
      appliedCount: 0,
      conflictCount: 0,
      failedCount: 0,
      touchedMoneyAccountProjection: false,
      touchedInventoryProjection: false,
      checkpointUpdates: [],
    };

    for (const tableResult of orderedTables) {
      const registryItem = getSyncRegistryItem(tableResult.tableName);
      if (!registryItem) {
        return {
          success: false,
          error: new Error(`Sync registry missing table ${tableResult.tableName}.`),
        };
      }

      let tableFailed = false;

      for (const change of tableResult.changes) {
        const sanitizedPayload = sanitizePayloadForPull(
          tableResult.tableName,
          change.payload,
        );
        const existingResult = await localDatasource.getLocalRecord(
          registryItem,
          change.recordRemoteId,
          scope.accountRemoteId,
        );

        if (!existingResult.success) {
          return existingResult;
        }

        const existing = existingResult.value;
        const existingPayload = existing?.payload ?? {};
        const localPendingChange =
          existing !== null && isPendingSyncStatus(existing.recordSyncStatus);
        const protectedFieldConflict =
          existing !== null &&
          (isFinancialConflict(
            tableResult.tableName,
            existingPayload,
            sanitizedPayload,
          ) ||
            isWorkflowConflict(
              tableResult.tableName,
              existingPayload,
              sanitizedPayload,
            ));

        if (localPendingChange || protectedFieldConflict) {
          const markConflictResult = await localDatasource.markRecordConflict({
            registryItem,
            recordRemoteId: change.recordRemoteId,
            accountRemoteId: scope.accountRemoteId,
          });
          if (!markConflictResult.success) {
            return markConflictResult;
          }

          const conflictResult = await localDatasource.recordSyncConflict({
            tableName: tableResult.tableName,
            recordRemoteId: change.recordRemoteId,
            accountRemoteId: scope.accountRemoteId,
            localPayloadJson: JSON.stringify(existingPayload),
            remotePayloadJson: JSON.stringify(sanitizedPayload),
            conflictPolicy: registryItem.conflictPolicy,
          });
          if (!conflictResult.success) {
            return conflictResult;
          }

          summary.conflictCount += 1;
          continue;
        }

        const isDeleteOperation =
          change.operation === SyncOperation.Delete ||
          typeof sanitizedPayload.deleted_at === "number";

        if (isDeleteOperation) {
          const tombstoneResult = await localDatasource.tombstoneRecord(
            registryItem,
            change.recordRemoteId,
            Number(sanitizedPayload.deleted_at ?? change.changedAt),
          );
          if (!tombstoneResult.success) {
            tableFailed = true;
            summary.failedCount += 1;
            break;
          }
          summary.appliedCount += 1;
        } else {
          const upsertResult = await localDatasource.upsertPulledRecord(
            registryItem,
            change.recordRemoteId,
            sanitizedPayload,
          );
          if (!upsertResult.success) {
            tableFailed = true;
            summary.failedCount += 1;
            break;
          }
          summary.appliedCount += 1;
        }

        if (
          tableResult.tableName === "transactions" ||
          tableResult.tableName === "money_accounts"
        ) {
          summary.touchedMoneyAccountProjection = true;
        }

        if (tableResult.tableName === "inventory_movements") {
          summary.touchedInventoryProjection = true;
        }
      }

      if (!tableFailed) {
        summary.checkpointUpdates.push({
          tableName: tableResult.tableName,
          serverCursor: tableResult.serverCursor,
        });
      }
    }

    return {
      success: true,
      value: summary,
    };
  },

  async saveCheckpoints(scope, checkpoints, lastPulledAt) {
    for (const checkpoint of checkpoints) {
      const result = await localDatasource.saveCheckpoint({
        ...scope,
        tableName: checkpoint.tableName,
        serverCursor: checkpoint.serverCursor,
        lastPulledAt,
      });
      if (!result.success) {
        return result;
      }
    }

    return {
      success: true,
      value: true,
    };
  },

  async listOpenConflicts(
    accountRemoteId: string,
  ): Promise<SyncResult<SyncConflictRecord[]>> {
    return localDatasource.listOpenConflicts(accountRemoteId);
  },

  async resolveConflict(
    conflictRemoteId: string,
    resolutionAction: SyncConflictResolutionActionValue,
  ): Promise<SyncResult<boolean>> {
    return localDatasource.resolveConflict({
      conflictRemoteId,
      resolutionAction,
    });
  },
});

const syncRegistryTablesOrdered = (): string[] => {
  return syncRegistryTableNames.sort(
    (left, right) => getSyncDependencyRank(left) - getSyncDependencyRank(right),
  );
};

const syncRegistryTableNames = [
  ...new Set(
    [
      "accounts",
      "business_profiles",
      "account_members",
      "account_roles",
      "account_role_permissions",
      "account_user_roles",
      "categories",
      "contacts",
      "money_accounts",
      "products",
      "inventory_movements",
      "billing_documents",
      "billing_document_items",
      "transactions",
      "ledger_entries",
      "orders",
      "order_lines",
      "pos_sales",
      "emi_plans",
      "emi_installments",
      "installment_payment_links",
      "budget_plans",
      "business_notes",
      "audit_events",
      "bill_photos",
    ].filter((tableName) => Boolean(getSyncRegistryItem(tableName))),
  ),
];
