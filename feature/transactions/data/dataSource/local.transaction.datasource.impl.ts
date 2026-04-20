import { Result } from "@/shared/types/result.types";
import { TransactionPostingStatus } from "@/feature/transactions/types/transaction.entity.types";
import { Database, Q } from "@nozbe/watermelondb";
import { TransactionDatasource } from "./transaction.datasource";
import { TransactionModel } from "./db/transaction.model";

const TRANSACTIONS_TABLE = "transactions";
const ORDER_SOURCE_ACTIONS = ["payment", "refund"] as const;

const isVisibleTransaction = (transaction: TransactionModel): boolean => {
  return (
    transaction.deletedAt === null ||
    transaction.postingStatus === TransactionPostingStatus.Voided
  );
};

const isPostedLikeTransaction = (transaction: TransactionModel): boolean => {
  return (
    transaction.deletedAt === null &&
    transaction.postingStatus !== TransactionPostingStatus.Voided
  );
};

export const createLocalTransactionDatasource = (
  database: Database,
): TransactionDatasource => ({
  async getTransactionsByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<Result<TransactionModel[]>> {
    try {
      const transactionsCollection =
        database.get<TransactionModel>(TRANSACTIONS_TABLE);
      const transactions = await transactionsCollection
        .query(
          Q.where("owner_user_remote_id", ownerUserRemoteId),
          Q.sortBy("happened_at", Q.desc),
        )
        .fetch();

      return {
        success: true,
        value: transactions.filter(isVisibleTransaction),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getPostedTransactionsByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<TransactionModel[]>> {
    try {
      const transactionsCollection =
        database.get<TransactionModel>(TRANSACTIONS_TABLE);
      const transactions = await transactionsCollection
        .query(
          Q.where("account_remote_id", accountRemoteId),
          Q.sortBy("happened_at", Q.desc),
        )
        .fetch();

      return {
        success: true,
        value: transactions.filter(isPostedLikeTransaction),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getPostedOrderTransactions(params): Promise<Result<TransactionModel[]>> {
    try {
      const transactionsCollection =
        database.get<TransactionModel>(TRANSACTIONS_TABLE);
      const transactions = await transactionsCollection
        .query(
          Q.where("account_remote_id", params.accountRemoteId),
          Q.where("source_module", "orders"),
          Q.where("source_remote_id", params.orderRemoteId),
          Q.sortBy("happened_at", Q.desc),
        )
        .fetch();

      return {
        success: true,
        value: transactions.filter(isPostedLikeTransaction),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getPostedOrderLinkedTransactionsByOrderRemoteIds(
    params,
  ): Promise<Result<TransactionModel[]>> {
    try {
      const normalizedOrderRemoteIds = Array.from(
        new Set(
          params.orderRemoteIds
            .map((orderRemoteId) => orderRemoteId.trim())
            .filter((orderRemoteId) => orderRemoteId.length > 0),
        ),
      );

      if (normalizedOrderRemoteIds.length === 0) {
        return {
          success: true,
          value: [],
        };
      }

      const transactionsCollection =
        database.get<TransactionModel>(TRANSACTIONS_TABLE);
      const transactions = await transactionsCollection
        .query(
          Q.where("account_remote_id", params.accountRemoteId),
          Q.where("source_module", "orders"),
          Q.where("source_remote_id", Q.oneOf(normalizedOrderRemoteIds)),
          Q.where("source_action", Q.oneOf([...ORDER_SOURCE_ACTIONS])),
          Q.where("posting_status", TransactionPostingStatus.Posted),
          Q.where("deleted_at", Q.eq(null)),
          Q.sortBy("happened_at", Q.desc),
        )
        .fetch();

      return {
        success: true,
        value: transactions.filter(isPostedLikeTransaction),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getLegacyUnlinkedOrderTransactionsForRepair(
    params,
  ): Promise<Result<TransactionModel[]>> {
    try {
      const transactionsCollection =
        database.get<TransactionModel>(TRANSACTIONS_TABLE);
      const transactions = await transactionsCollection
        .query(
          Q.where("account_remote_id", params.accountRemoteId),
          Q.where("source_module", "orders"),
          Q.where("source_action", Q.oneOf([...ORDER_SOURCE_ACTIONS])),
          Q.or(
            Q.where("source_remote_id", Q.eq(null)),
            Q.where("source_remote_id", ""),
          ),
          Q.where("posting_status", TransactionPostingStatus.Posted),
          Q.where("deleted_at", Q.eq(null)),
          Q.sortBy("happened_at", Q.desc),
        )
        .fetch();

      return {
        success: true,
        value: transactions.filter(isPostedLikeTransaction),
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
      const transactionsCollection =
        database.get<TransactionModel>(TRANSACTIONS_TABLE);
      const matchingTransactions = await transactionsCollection
        .query(Q.where("remote_id", remoteId))
        .fetch();

      const transaction = matchingTransactions[0] ?? null;

      return {
        success: true,
        value: transaction && isVisibleTransaction(transaction) ? transaction : null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
