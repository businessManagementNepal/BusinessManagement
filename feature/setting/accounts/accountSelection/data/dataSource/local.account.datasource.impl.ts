import { Result } from "@/shared/types/result.types";
import { Database, Q } from "@nozbe/watermelondb";
import {
  BUSINESS_TYPE_VALUES,
  BusinessTypeValue,
} from "@/shared/constants/businessType.constants";
import {
  AccountSyncStatus,
  SaveAccountPayload,
} from "../../types/accountSelection.types";
import { AccountDatasource } from "./account.datasource";
import { AccountModel } from "./db/account.model";

const ACCOUNTS_TABLE = "accounts";

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const normalizeBusinessType = (
  value: SaveAccountPayload["businessType"],
): BusinessTypeValue | null => {
  if (value === null) {
    return null;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  return BUSINESS_TYPE_VALUES.includes(normalizedValue as BusinessTypeValue)
    ? (normalizedValue as BusinessTypeValue)
    : null;
};

const setCreatedAndUpdatedAt = (record: AccountModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (record: AccountModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateSyncStatusOnMutation = (record: AccountModel) => {
  if (!record.recordSyncStatus) {
    record.recordSyncStatus = AccountSyncStatus.PendingUpdate;
    return;
  }

  if (record.recordSyncStatus === AccountSyncStatus.Synced) {
    record.recordSyncStatus = AccountSyncStatus.PendingUpdate;
  }
};

const sortAccounts = (accounts: AccountModel[]): AccountModel[] => {
  return [...accounts].sort((leftAccount, rightAccount) => {
    if (leftAccount.isDefault !== rightAccount.isDefault) {
      return leftAccount.isDefault ? -1 : 1;
    }

    return rightAccount.updatedAt.getTime() - leftAccount.updatedAt.getTime();
  });
};

const clearDefaultFromOtherAccounts = async (
  accounts: AccountModel[],
  currentRemoteId: string,
  now: number,
): Promise<void> => {
  for (const account of accounts) {
    if (account.remoteId === currentRemoteId) {
      continue;
    }

    await account.update((record) => {
      if (!record.isDefault) {
        return;
      }

      record.isDefault = false;
      updateSyncStatusOnMutation(record);
      setUpdatedAt(record, now);
    });
  }
};

export const createLocalAccountDatasource = (
  database: Database,
): AccountDatasource => ({
  async saveAccount(payload: SaveAccountPayload): Promise<Result<AccountModel>> {
    try {
      const normalizedRemoteId = normalizeRequired(payload.remoteId);
      const normalizedOwnerUserRemoteId = normalizeRequired(
        payload.ownerUserRemoteId,
      );
      const normalizedDisplayName = normalizeRequired(payload.displayName);

      if (!normalizedRemoteId) {
        throw new Error("Remote id is required");
      }

      if (!normalizedOwnerUserRemoteId) {
        throw new Error("Owner user remote id is required");
      }

      if (!normalizedDisplayName) {
        throw new Error("Display name is required");
      }

      const normalizedCurrencyCode = normalizeOptional(payload.currencyCode);
      const normalizedCityOrLocation = normalizeOptional(payload.cityOrLocation);
      const normalizedCountryCode = normalizeOptional(payload.countryCode);
      const normalizedBusinessType =
        payload.accountType === "business"
          ? normalizeBusinessType(payload.businessType)
          : null;

      const accountsCollection = database.get<AccountModel>(ACCOUNTS_TABLE);
      const ownerDefaultAccounts = payload.isDefault
        ? await accountsCollection
            .query(
              Q.where("owner_user_remote_id", normalizedOwnerUserRemoteId),
              Q.where("is_default", true),
            )
            .fetch()
        : [];

      const existingAccounts = await accountsCollection
        .query(Q.where("remote_id", normalizedRemoteId))
        .fetch();

      const existingAccount = existingAccounts[0];

      if (existingAccount) {
        await database.write(async () => {
          const now = Date.now();

          await existingAccount.update((record) => {
            record.remoteId = normalizedRemoteId;
            record.ownerUserRemoteId = normalizedOwnerUserRemoteId;
            record.accountType = payload.accountType;
            record.businessType = normalizedBusinessType;
            record.displayName = normalizedDisplayName;
            record.currencyCode = normalizedCurrencyCode;
            record.cityOrLocation = normalizedCityOrLocation;
            record.countryCode = normalizedCountryCode;
            record.isActive = payload.isActive;
            record.isDefault = payload.isDefault;
            updateSyncStatusOnMutation(record);
            setUpdatedAt(record, now);
          });

          if (payload.isDefault) {
            await clearDefaultFromOtherAccounts(
              ownerDefaultAccounts,
              normalizedRemoteId,
              now,
            );
          }
        });

        return { success: true, value: existingAccount };
      }

      let createdAccount!: AccountModel;

      await database.write(async () => {
        const now = Date.now();

        createdAccount = await accountsCollection.create((record) => {
          record.remoteId = normalizedRemoteId;
          record.ownerUserRemoteId = normalizedOwnerUserRemoteId;
          record.accountType = payload.accountType;
          record.businessType = normalizedBusinessType;
          record.displayName = normalizedDisplayName;
          record.currencyCode = normalizedCurrencyCode;
          record.cityOrLocation = normalizedCityOrLocation;
          record.countryCode = normalizedCountryCode;
          record.isActive = payload.isActive;
          record.isDefault = payload.isDefault;

          record.recordSyncStatus = AccountSyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;

          setCreatedAndUpdatedAt(record, now);
        });

        if (payload.isDefault) {
          await clearDefaultFromOtherAccounts(
            ownerDefaultAccounts,
            normalizedRemoteId,
            now,
          );
        }
      });

      return { success: true, value: createdAccount };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getAccountsByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<Result<AccountModel[]>> {
    try {
      const normalizedOwnerUserRemoteId = normalizeRequired(ownerUserRemoteId);

      if (!normalizedOwnerUserRemoteId) {
        throw new Error("Owner user remote id is required");
      }

      const accountsCollection = database.get<AccountModel>(ACCOUNTS_TABLE);

      const matchingAccounts = await accountsCollection
        .query(
          Q.where("owner_user_remote_id", normalizedOwnerUserRemoteId),
          Q.where("is_active", true),
        )
        .fetch();

      return {
        success: true,
        value: sortAccounts(matchingAccounts),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
