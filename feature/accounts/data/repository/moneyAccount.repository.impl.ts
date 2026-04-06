import {
  MoneyAccountDatabaseError,
  MoneyAccountError,
  MoneyAccountNotFoundError,
  MoneyAccountResult,
  MoneyAccountUnknownError,
  MoneyAccountsResult,
  SaveMoneyAccountPayload,
} from "@/feature/accounts/types/moneyAccount.types";
import { MoneyAccountDatasource } from "../dataSource/moneyAccount.datasource";
import { MoneyAccountRepository } from "./moneyAccount.repository";
import { mapMoneyAccountModelToDomain } from "./mapper/moneyAccount.mapper";

export const createMoneyAccountRepository = (
  localDatasource: MoneyAccountDatasource,
): MoneyAccountRepository => ({
  async saveMoneyAccount(
    payload: SaveMoneyAccountPayload,
  ): Promise<MoneyAccountResult> {
    const result = await localDatasource.saveMoneyAccount(payload);

    if (result.success) {
      return mapMoneyAccountModel(result.value);
    }

    return {
      success: false,
      error: mapMoneyAccountError(result.error),
    };
  },

  async archiveMoneyAccountByRemoteId(remoteId: string) {
    const result = await localDatasource.archiveMoneyAccountByRemoteId(remoteId);

    if (!result.success) {
      return {
        success: false,
        error: mapMoneyAccountError(result.error),
      };
    }

    return result;
  },

  async getMoneyAccountsByScopeAccountRemoteId(
    scopeAccountRemoteId: string,
  ): Promise<MoneyAccountsResult> {
    const result =
      await localDatasource.getMoneyAccountsByScopeAccountRemoteId(
        scopeAccountRemoteId,
      );

    if (!result.success) {
      return {
        success: false,
        error: mapMoneyAccountError(result.error),
      };
    }

    try {
      const mappedAccounts = await Promise.all(
        result.value.map((model) => mapMoneyAccountModelToDomain(model)),
      );

      return {
        success: true,
        value: mappedAccounts,
      };
    } catch (error) {
      return {
        success: false,
        error: mapMoneyAccountError(error),
      };
    }
  },

  async getMoneyAccountByRemoteId(remoteId: string): Promise<MoneyAccountResult> {
    const result = await localDatasource.getMoneyAccountByRemoteId(remoteId);

    if (!result.success) {
      return {
        success: false,
        error: mapMoneyAccountError(result.error),
      };
    }

    if (!result.value) {
      return {
        success: false,
        error: MoneyAccountNotFoundError,
      };
    }

    return mapMoneyAccountModel(result.value);
  },
});

const mapMoneyAccountModel = async (
  model: Parameters<typeof mapMoneyAccountModelToDomain>[0],
): Promise<MoneyAccountResult> => {
  try {
    return {
      success: true,
      value: await mapMoneyAccountModelToDomain(model),
    };
  } catch (error) {
    return {
      success: false,
      error: mapMoneyAccountError(error),
    };
  }
};

const mapMoneyAccountError = (error: Error | unknown): MoneyAccountError => {
  if (!(error instanceof Error)) {
    return MoneyAccountUnknownError;
  }

  const message = error.message.toLowerCase();

  if (message.includes("money account not found")) {
    return MoneyAccountNotFoundError;
  }

  const isDatabaseError =
    message.includes("table") ||
    message.includes("schema") ||
    message.includes("database") ||
    message.includes("adapter") ||
    message.includes("timeout");

  if (isDatabaseError) {
    return {
      ...MoneyAccountDatabaseError,
      message: error.message,
    };
  }

  return {
    ...MoneyAccountUnknownError,
    message: error.message,
  };
};
