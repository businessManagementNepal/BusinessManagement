import {
  SaveTransactionPayload,
  TransactionOperationResult,
  TransactionResult,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  TransactionDatabaseError,
  TransactionError,
  TransactionUnknownError,
} from "@/feature/transactions/types/transaction.error.types";
import type { RunMoneyPostingWorkflowUseCase } from "@/feature/transactions/workflow/moneyPosting/useCase/runMoneyPostingWorkflow.useCase";
import { mapTransactionModelToDomain } from "./mapper/transaction.mapper";
import { MoneyPostingRepository } from "./moneyPosting.repository";

export const createMoneyPostingRepository = (
  workflowUseCase: RunMoneyPostingWorkflowUseCase,
): MoneyPostingRepository => ({
  async postMoneyMovement(
    payload: SaveTransactionPayload,
  ): Promise<TransactionResult> {
    const result = await workflowUseCase.postMoneyMovement(payload);

    if (!result.success) {
      return {
        success: false,
        error: mapTransactionError(result.error),
      };
    }

    try {
      return {
        success: true,
        value: await mapTransactionModelToDomain(result.value),
      };
    } catch (error) {
      return {
        success: false,
        error: mapTransactionError(error),
      };
    }
  },

  async deleteMoneyMovementByRemoteId(
    remoteId: string,
  ): Promise<TransactionOperationResult> {
    const result = await workflowUseCase.deleteMoneyMovementByRemoteId(remoteId);

    if (result.success) {
      return result;
    }

    return {
      success: false,
      error: mapTransactionError(result.error),
    };
  },
});

const mapTransactionError = (error: Error | unknown): TransactionError => {
  if (!(error instanceof Error)) {
    return TransactionUnknownError;
  }

  const message = error.message.toLowerCase();
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
