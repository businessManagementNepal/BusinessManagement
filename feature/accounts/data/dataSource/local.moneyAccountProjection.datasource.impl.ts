import { MoneyAccountModel } from "@/feature/accounts/data/dataSource/db/moneyAccount.model";
import { TransactionModel } from "@/feature/transactions/data/dataSource/db/transaction.model";
import { TransactionPostingStatus } from "@/feature/transactions/types/transaction.entity.types";
import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import { MoneyAccountProjectionDatasource } from "./moneyAccountProjection.datasource";

const MONEY_ACCOUNTS_TABLE = "money_accounts";
const TRANSACTIONS_TABLE = "transactions";

const setUpdatedAt = (record: MoneyAccountModel, now: number): void => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

export const createLocalMoneyAccountProjectionDatasource = (
  database: Database,
): MoneyAccountProjectionDatasource => ({
  async getActiveMoneyAccountsByScopeAccountRemoteId(
    scopeAccountRemoteId: string,
  ): Promise<Result<MoneyAccountModel[]>> {
    try {
      const collection = database.get<MoneyAccountModel>(MONEY_ACCOUNTS_TABLE);
      const records = await collection
        .query(
          Q.where("scope_account_remote_id", scopeAccountRemoteId),
          Q.where("deleted_at", Q.eq(null)),
          Q.where("is_active", true),
        )
        .fetch();

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

  async getPostedTransactionsByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<TransactionModel[]>> {
    try {
      const collection = database.get<TransactionModel>(TRANSACTIONS_TABLE);
      const records = await collection
        .query(
          Q.where("account_remote_id", accountRemoteId),
          Q.where("deleted_at", Q.eq(null)),
          Q.where("posting_status", TransactionPostingStatus.Posted),
        )
        .fetch();

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

  async replaceMoneyAccountBalances(
    balancesByRemoteId: Readonly<Record<string, number>>,
  ): Promise<Result<boolean>> {
    try {
      const remoteIds = Object.keys(balancesByRemoteId);
      if (remoteIds.length === 0) {
        return { success: true, value: true };
      }

      const collection = database.get<MoneyAccountModel>(MONEY_ACCOUNTS_TABLE);
      const accounts = await collection
        .query(Q.where("remote_id", Q.oneOf(remoteIds)))
        .fetch();

      await database.write(async () => {
        const now = Date.now();
        for (const account of accounts) {
          await account.update((record) => {
            record.currentBalance = balancesByRemoteId[account.remoteId] ?? 0;
            setUpdatedAt(record, now);
          });
        }
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
