import { MoneyAccountModel } from "@/feature/accounts/data/dataSource/db/moneyAccount.model";
import { MoneyAccountSyncStatus } from "@/feature/accounts/types/moneyAccount.types";
import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import { MoneyAccountBalanceDatasource } from "./moneyAccountBalance.datasource";

const MONEY_ACCOUNTS_TABLE = "money_accounts";

const roundToCurrencyScale = (value: number): number => {
  return Number(value.toFixed(2));
};

const setMoneyAccountUpdatedAt = (record: MoneyAccountModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateMoneyAccountSyncStatusOnMutation = (record: MoneyAccountModel) => {
  if (!record.recordSyncStatus) {
    record.recordSyncStatus = MoneyAccountSyncStatus.PendingUpdate;
    return;
  }

  if (record.recordSyncStatus === MoneyAccountSyncStatus.Synced) {
    record.recordSyncStatus = MoneyAccountSyncStatus.PendingUpdate;
  }
};

export const createLocalMoneyAccountBalanceDatasource = (
  database: Database,
): MoneyAccountBalanceDatasource => ({
  async getActiveMoneyAccountByRemoteId(
    remoteId: string,
  ): Promise<Result<MoneyAccountModel | null>> {
    try {
      const collection = database.get<MoneyAccountModel>(MONEY_ACCOUNTS_TABLE);
      const matching = await collection
        .query(
          Q.where("remote_id", remoteId),
          Q.where("is_active", true),
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

  async applyMoneyAccountBalanceDelta(
    existing: MoneyAccountModel,
    delta: number,
  ): Promise<Result<MoneyAccountModel>> {
    try {
      await existing.update((record) => {
        record.currentBalance = roundToCurrencyScale(
          record.currentBalance + delta,
        );
        updateMoneyAccountSyncStatusOnMutation(record);
        setMoneyAccountUpdatedAt(record, Date.now());
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
