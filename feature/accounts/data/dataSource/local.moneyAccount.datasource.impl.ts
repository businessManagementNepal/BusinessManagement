import { Database, Q } from "@nozbe/watermelondb";
import { Result } from "@/shared/types/result.types";
import {
  MoneyAccountSyncStatus,
  SaveMoneyAccountPayload,
} from "@/feature/accounts/types/moneyAccount.types";
import { MoneyAccountDatasource } from "./moneyAccount.datasource";
import { MoneyAccountModel } from "./db/moneyAccount.model";

const MONEY_ACCOUNTS_TABLE = "money_accounts";

const setCreatedAndUpdatedAt = (
  record: MoneyAccountModel,
  now: number,
): void => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (record: MoneyAccountModel, now: number): void => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateSyncStatusOnMutation = (record: MoneyAccountModel): void => {
  if (!record.recordSyncStatus) {
    record.recordSyncStatus = MoneyAccountSyncStatus.PendingUpdate;
    return;
  }

  if (record.recordSyncStatus === MoneyAccountSyncStatus.Synced) {
    record.recordSyncStatus = MoneyAccountSyncStatus.PendingUpdate;
  }
};

export const createLocalMoneyAccountDatasource = (
  database: Database,
): MoneyAccountDatasource => ({
  async saveMoneyAccount(
    payload: SaveMoneyAccountPayload,
  ): Promise<Result<MoneyAccountModel>> {
    try {
      const collection = database.get<MoneyAccountModel>(MONEY_ACCOUNTS_TABLE);
      const existingRecords = await collection
        .query(Q.where("remote_id", payload.remoteId))
        .fetch();

      const existingRecord = existingRecords[0] ?? null;

      const scopeRecords = await collection
        .query(Q.where("scope_account_remote_id", payload.scopeAccountRemoteId))
        .fetch();

      const activeScopeRecords = scopeRecords.filter(
        (record) => record.deletedAt === null && record.isActive,
      );

      if (existingRecord) {
        await database.write(async () => {
          if (payload.isPrimary) {
            for (const scopeRecord of activeScopeRecords) {
              if (scopeRecord.remoteId === existingRecord.remoteId) {
                continue;
              }

              if (!scopeRecord.isPrimary) {
                continue;
              }

              await scopeRecord.update((record) => {
                record.isPrimary = false;
                updateSyncStatusOnMutation(record);
                setUpdatedAt(record, Date.now());
              });
            }
          }

          await existingRecord.update((record) => {
            record.ownerUserRemoteId = payload.ownerUserRemoteId;
            record.scopeAccountRemoteId = payload.scopeAccountRemoteId;
            record.name = payload.name;
            record.accountType = payload.type;
            record.description = payload.description;
            record.currencyCode = payload.currencyCode;
            record.isPrimary = payload.isPrimary;
            record.isActive = payload.isActive;
            record.deletedAt = null;
            updateSyncStatusOnMutation(record);
            setUpdatedAt(record, Date.now());
          });
        });

        return {
          success: true,
          value: existingRecord,
        };
      }

      let createdRecord!: MoneyAccountModel;

      await database.write(async () => {
        if (payload.isPrimary) {
          for (const scopeRecord of activeScopeRecords) {
            if (!scopeRecord.isPrimary) {
              continue;
            }

            await scopeRecord.update((record) => {
              record.isPrimary = false;
              updateSyncStatusOnMutation(record);
              setUpdatedAt(record, Date.now());
            });
          }
        }

        createdRecord = await collection.create((record) => {
          const now = Date.now();

          record.remoteId = payload.remoteId;
          record.ownerUserRemoteId = payload.ownerUserRemoteId;
          record.scopeAccountRemoteId = payload.scopeAccountRemoteId;
          record.name = payload.name;
          record.accountType = payload.type;
          record.currentBalance = 0;
          record.openingBalanceAmount = 0;
          record.openingBalanceDirection = "in";
          record.description = payload.description;
          record.currencyCode = payload.currencyCode;
          record.isPrimary = payload.isPrimary;
          record.isActive = payload.isActive;
          record.recordSyncStatus = MoneyAccountSyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;

          setCreatedAndUpdatedAt(record, now);
        });
      });

      return {
        success: true,
        value: createdRecord,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async archiveMoneyAccountByRemoteId(remoteId: string): Promise<Result<boolean>> {
    try {
      const normalizedRemoteId = remoteId.trim();
      if (!normalizedRemoteId) {
        throw new Error("Money account remote id is required");
      }

      const collection = database.get<MoneyAccountModel>(MONEY_ACCOUNTS_TABLE);
      const records = await collection
        .query(Q.where("remote_id", normalizedRemoteId))
        .fetch();
      const existingRecord = records[0] ?? null;

      if (!existingRecord || existingRecord.deletedAt !== null || !existingRecord.isActive) {
        throw new Error("Money account not found");
      }
      if (existingRecord.isPrimary) {
        throw new Error("Primary account cannot be deleted");
      }

      const scopeRecords = await collection
        .query(Q.where("scope_account_remote_id", existingRecord.scopeAccountRemoteId))
        .fetch();

      const remainingActiveCount = scopeRecords.filter(
        (record) =>
          record.remoteId !== existingRecord.remoteId &&
          record.deletedAt === null &&
          record.isActive,
      ).length;

      if (remainingActiveCount === 0) {
        throw new Error("At least one active money account is required");
      }

      await database.write(async () => {
        await existingRecord.update((record) => {
          record.isActive = false;
          record.deletedAt = Date.now();
          record.recordSyncStatus = MoneyAccountSyncStatus.PendingDelete;
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

  async getMoneyAccountsByScopeAccountRemoteId(
    scopeAccountRemoteId: string,
  ): Promise<Result<MoneyAccountModel[]>> {
    try {
      const collection = database.get<MoneyAccountModel>(MONEY_ACCOUNTS_TABLE);
      const records = await collection
        .query(
          Q.where("scope_account_remote_id", scopeAccountRemoteId),
          Q.sortBy("updated_at", Q.desc),
        )
        .fetch();

      return {
        success: true,
        value: records.filter((record) => record.deletedAt === null && record.isActive),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getMoneyAccountByRemoteId(
    remoteId: string,
  ): Promise<Result<MoneyAccountModel | null>> {
    try {
      const collection = database.get<MoneyAccountModel>(MONEY_ACCOUNTS_TABLE);
      const records = await collection.query(Q.where("remote_id", remoteId)).fetch();
      const record = records[0] ?? null;

      return {
        success: true,
        value: record?.deletedAt === null ? record : null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
