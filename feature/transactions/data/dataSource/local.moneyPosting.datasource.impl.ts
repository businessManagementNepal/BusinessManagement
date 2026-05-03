import { TransactionModel } from "@/feature/transactions/data/dataSource/db/transaction.model";
import {
  SaveTransactionPayload,
  TransactionPostingStatus,
  TransactionPostingStatusValue,
  TransactionSyncStatus,
} from "@/feature/transactions/types/transaction.entity.types";
import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import { MoneyPostingDatasource } from "./moneyPosting.datasource";

const TRANSACTIONS_TABLE = "transactions";

const setTransactionCreatedAndUpdatedAt = (
  record: TransactionModel,
  now: number,
) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setTransactionUpdatedAt = (record: TransactionModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateTransactionSyncStatusOnMutation = (record: TransactionModel) => {
  if (!record.recordSyncStatus) {
    record.recordSyncStatus = TransactionSyncStatus.PendingUpdate;
    return;
  }

  if (record.recordSyncStatus === TransactionSyncStatus.Synced) {
    record.recordSyncStatus = TransactionSyncStatus.PendingUpdate;
  }
};

const applyTransactionPayload = ({
  record,
  payload,
  postingStatus,
}: {
  record: TransactionModel;
  payload: SaveTransactionPayload;
  postingStatus: TransactionPostingStatusValue;
}) => {
  record.ownerUserRemoteId = payload.ownerUserRemoteId;
  record.accountRemoteId = payload.accountRemoteId;
  record.accountDisplayNameSnapshot = payload.accountDisplayNameSnapshot;
  record.transactionType = payload.transactionType;
  record.direction = payload.direction;
  record.title = payload.title;
  record.amount = payload.amount;
  record.currencyCode = payload.currencyCode;
  record.categoryRemoteId = payload.categoryRemoteId ?? null;
  record.categoryNameSnapshot = payload.categoryNameSnapshot ?? null;
  record.categoryLabel = payload.categoryLabel;
  record.note = payload.note;
  record.happenedAt = payload.happenedAt;
  record.contactRemoteId = payload.contactRemoteId ?? null;
  record.settlementMoneyAccountRemoteId =
    payload.settlementMoneyAccountRemoteId ?? null;
  record.settlementMoneyAccountDisplayNameSnapshot =
    payload.settlementMoneyAccountDisplayNameSnapshot ?? null;
  record.sourceModule = payload.sourceModule ?? null;
  record.sourceRemoteId = payload.sourceRemoteId ?? null;
  record.sourceAction = payload.sourceAction ?? null;
  record.idempotencyKey = payload.idempotencyKey ?? null;
  record.postingStatus = postingStatus;
  record.deletedAt = null;
};

export const createLocalMoneyPostingDatasource = (
  database: Database,
): MoneyPostingDatasource => ({
  async getTransactionByRemoteId(
    remoteId: string,
  ): Promise<Result<TransactionModel | null>> {
    try {
      const collection = database.get<TransactionModel>(TRANSACTIONS_TABLE);
      const matching = await collection.query(Q.where("remote_id", remoteId)).fetch();

      return {
        success: true,
        value: matching[0] ?? null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getActiveTransactionByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<Result<TransactionModel | null>> {
    try {
      const collection = database.get<TransactionModel>(TRANSACTIONS_TABLE);
      const matching = await collection
        .query(
          Q.where("idempotency_key", idempotencyKey),
          Q.where("deleted_at", Q.eq(null)),
        )
        .fetch();

      return {
        success: true,
        value: matching[0] ?? null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async runInTransaction<T>(operation: () => Promise<T>): Promise<Result<T>> {
    try {
      let value!: T;

      await database.write(async () => {
        value = await operation();
      });

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

  async createTransaction(
    payload: SaveTransactionPayload,
    postingStatus: TransactionPostingStatusValue,
  ): Promise<Result<TransactionModel>> {
    try {
      const collection = database.get<TransactionModel>(TRANSACTIONS_TABLE);
      const persisted = await collection.create((record) => {
        const now = Date.now();

        record.remoteId = payload.remoteId;
        applyTransactionPayload({
          record,
          payload,
          postingStatus,
        });
        record.recordSyncStatus = TransactionSyncStatus.PendingCreate;
        record.lastSyncedAt = null;

        setTransactionCreatedAndUpdatedAt(record, now);
      });

      return {
        success: true,
        value: persisted,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async updateTransaction(
    existing: TransactionModel,
    payload: SaveTransactionPayload,
    postingStatus: TransactionPostingStatusValue,
  ): Promise<Result<TransactionModel>> {
    try {
      await existing.update((record) => {
        applyTransactionPayload({
          record,
          payload,
          postingStatus,
        });
        updateTransactionSyncStatusOnMutation(record);
        setTransactionUpdatedAt(record, Date.now());
      });

      return {
        success: true,
        value: existing,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async markTransactionVoided(
    existing: TransactionModel,
  ): Promise<Result<TransactionModel>> {
    try {
      await existing.update((record) => {
        record.deletedAt = null;
        record.postingStatus = TransactionPostingStatus.Voided;
        updateTransactionSyncStatusOnMutation(record);
        setTransactionUpdatedAt(record, Date.now());
      });

      return {
        success: true,
        value: existing,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
