import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import {
  SaveTransactionPayload,
  TransactionPostingStatus,
  TransactionSyncStatus,
} from "@/feature/transactions/types/transaction.entity.types";
import { TransactionDatasource } from "./transaction.datasource";
import { TransactionModel } from "./db/transaction.model";

const TRANSACTIONS_TABLE = "transactions";

const setCreatedAndUpdatedAt = (record: TransactionModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (record: TransactionModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateSyncStatusOnMutation = (record: TransactionModel) => {
  if (!record.recordSyncStatus) {
    record.recordSyncStatus = TransactionSyncStatus.PendingUpdate;
    return;
  }

  if (record.recordSyncStatus === TransactionSyncStatus.Synced) {
    record.recordSyncStatus = TransactionSyncStatus.PendingUpdate;
  }
};

export const createLocalTransactionDatasource = (
  database: Database,
): TransactionDatasource => ({
  async saveTransaction(
    payload: SaveTransactionPayload,
  ): Promise<Result<TransactionModel>> {
    try {
      const transactionsCollection = database.get<TransactionModel>(
        TRANSACTIONS_TABLE,
      );
      const existingTransactions = await transactionsCollection
        .query(Q.where("remote_id", payload.remoteId))
        .fetch();

      const existingTransaction = existingTransactions[0];

      if (existingTransaction) {
        await database.write(async () => {
          await existingTransaction.update((record) => {
            record.ownerUserRemoteId = payload.ownerUserRemoteId;
            record.accountRemoteId = payload.accountRemoteId;
            record.accountDisplayNameSnapshot = payload.accountDisplayNameSnapshot;
            record.transactionType = payload.transactionType;
            record.direction = payload.direction;
            record.title = payload.title;
            record.amount = payload.amount;
            record.currencyCode = payload.currencyCode;
            record.categoryLabel = payload.categoryLabel;
            record.note = payload.note;
            record.happenedAt = payload.happenedAt;
            record.settlementMoneyAccountRemoteId =
              payload.settlementMoneyAccountRemoteId ?? null;
            record.settlementMoneyAccountDisplayNameSnapshot =
              payload.settlementMoneyAccountDisplayNameSnapshot ?? null;
            record.sourceModule = payload.sourceModule ?? null;
            record.sourceRemoteId = payload.sourceRemoteId ?? null;
            record.sourceAction = payload.sourceAction ?? null;
            record.idempotencyKey = payload.idempotencyKey ?? null;
            record.postingStatus =
              payload.postingStatus ??
              record.postingStatus ??
              TransactionPostingStatus.Posted;
            record.deletedAt = null;
            updateSyncStatusOnMutation(record);
            setUpdatedAt(record, Date.now());
          });
        });

        return { success: true, value: existingTransaction };
      }

      let createdTransaction!: TransactionModel;

      await database.write(async () => {
        createdTransaction = await transactionsCollection.create((record) => {
          const now = Date.now();

          record.remoteId = payload.remoteId;
          record.ownerUserRemoteId = payload.ownerUserRemoteId;
          record.accountRemoteId = payload.accountRemoteId;
          record.accountDisplayNameSnapshot = payload.accountDisplayNameSnapshot;
          record.transactionType = payload.transactionType;
          record.direction = payload.direction;
          record.title = payload.title;
          record.amount = payload.amount;
          record.currencyCode = payload.currencyCode;
          record.categoryLabel = payload.categoryLabel;
          record.note = payload.note;
          record.happenedAt = payload.happenedAt;
          record.settlementMoneyAccountRemoteId =
            payload.settlementMoneyAccountRemoteId ?? null;
          record.settlementMoneyAccountDisplayNameSnapshot =
            payload.settlementMoneyAccountDisplayNameSnapshot ?? null;
          record.sourceModule = payload.sourceModule ?? null;
          record.sourceRemoteId = payload.sourceRemoteId ?? null;
          record.sourceAction = payload.sourceAction ?? null;
          record.idempotencyKey = payload.idempotencyKey ?? null;
          record.postingStatus =
            payload.postingStatus ?? TransactionPostingStatus.Posted;
          record.recordSyncStatus = TransactionSyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;

          setCreatedAndUpdatedAt(record, now);
        });
      });

      return { success: true, value: createdTransaction };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getTransactionsByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<Result<TransactionModel[]>> {
    try {
      const transactionsCollection = database.get<TransactionModel>(
        TRANSACTIONS_TABLE,
      );
      const transactions = await transactionsCollection
        .query(
          Q.where("owner_user_remote_id", ownerUserRemoteId),
          Q.sortBy("happened_at", Q.desc),
        )
        .fetch();

      return {
        success: true,
        value: transactions.filter((transaction) => transaction.deletedAt === null),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getTransactionByRemoteId(
    remoteId: string,
  ): Promise<Result<TransactionModel | null>> {
    try {
      const transactionsCollection = database.get<TransactionModel>(
        TRANSACTIONS_TABLE,
      );
      const matchingTransactions = await transactionsCollection
        .query(Q.where("remote_id", remoteId))
        .fetch();

      const transaction = matchingTransactions[0] ?? null;

      return {
        success: true,
        value: transaction?.deletedAt === null ? transaction : null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async deleteTransactionByRemoteId(remoteId: string): Promise<Result<boolean>> {
    try {
      const transactionsCollection = database.get<TransactionModel>(
        TRANSACTIONS_TABLE,
      );
      const matchingTransactions = await transactionsCollection
        .query(Q.where("remote_id", remoteId))
        .fetch();

      const transaction = matchingTransactions[0];

      if (!transaction) {
        return {
          success: true,
          value: false,
        };
      }

      await database.write(async () => {
        await transaction.update((record) => {
          record.deletedAt = Date.now();
          updateSyncStatusOnMutation(record);
          setUpdatedAt(record, Date.now());
        });
      });

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
});
