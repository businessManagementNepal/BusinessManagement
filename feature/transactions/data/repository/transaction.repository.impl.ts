import {
  SaveTransactionPayload,
  TransactionOperationResult,
  TransactionResult,
  TransactionsResult,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  TransactionDatabaseError,
  TransactionError,
  TransactionNotFoundError,
  TransactionUnknownError,
} from "@/feature/transactions/types/transaction.error.types";
import { TransactionDatasource } from "../dataSource/transaction.datasource";
import { TransactionRepository } from "./transaction.repository";
import { mapTransactionModelToDomain } from "./mapper/transaction.mapper";

export const createTransactionRepository = (
  localDatasource: TransactionDatasource,
): TransactionRepository => ({
  async saveTransaction(payload: SaveTransactionPayload): Promise<TransactionResult> {
    const result = await localDatasource.saveTransaction(payload);

    if (result.success) {
      return mapTransactionModel(result.value);
    }

    return {
      success: false,
      error: mapTransactionError(result.error),
    };
  },

  async getTransactionsByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<TransactionsResult> {
    const result = await localDatasource.getTransactionsByOwnerUserRemoteId(
      ownerUserRemoteId,
    );

    if (!result.success) {
      return {
        success: false,
        error: mapTransactionError(result.error),
      };
    }

    try {
      const mappedTransactions = await Promise.all(
        result.value.map((transactionModel) =>
          mapTransactionModelToDomain(transactionModel),
        ),
      );

      return {
        success: true,
        value: mappedTransactions,
      };
    } catch (error) {
      return {
        success: false,
        error: mapTransactionError(error),
      };
    }
  },

  async getTransactionByRemoteId(remoteId: string): Promise<TransactionResult> {
    const result = await localDatasource.getTransactionByRemoteId(remoteId);

    if (!result.success) {
      return {
        success: false,
        error: mapTransactionError(result.error),
      };
    }

    if (!result.value) {
      return {
        success: false,
        error: TransactionNotFoundError,
      };
    }

    return mapTransactionModel(result.value);
  },

  async deleteTransactionByRemoteId(
    remoteId: string,
  ): Promise<TransactionOperationResult> {
    const result = await localDatasource.deleteTransactionByRemoteId(remoteId);

    if (result.success) {
      return result;
    }

    return {
      success: false,
      error: mapTransactionError(result.error),
    };
  },
});

const mapTransactionModel = async (
  model: Parameters<typeof mapTransactionModelToDomain>[0],
): Promise<TransactionResult> => {
  try {
    return {
      success: true,
      value: await mapTransactionModelToDomain(model),
    };
  } catch (error) {
    return {
      success: false,
      error: mapTransactionError(error),
    };
  }
};

const mapTransactionError = (error: Error | unknown): TransactionError => {
  if (!(error instanceof Error)) {
    return TransactionUnknownError;
  }

  const message = error.message.toLowerCase();

  if (message.includes("transaction not found")) {
    return TransactionNotFoundError;
  }

  const isDatabaseError =
    message.includes("table") ||
    message.includes("schema") ||
    message.includes("database") ||
    message.includes("adapter") ||
    message.includes("timeout");

  if (isDatabaseError) {
    return {
      ...TransactionDatabaseError,
      message: error.message,
    };
  }

  return {
    ...TransactionUnknownError,
    message: error.message,
  };
};
