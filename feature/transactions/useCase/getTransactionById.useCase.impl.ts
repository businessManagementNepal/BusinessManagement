import { TransactionRepository } from "@/feature/transactions/data/repository/transaction.repository";
import { TransactionValidationError } from "@/feature/transactions/types/transaction.error.types";
import { TransactionResult } from "@/feature/transactions/types/transaction.entity.types";
import { GetTransactionByIdUseCase } from "./getTransactionById.useCase";

export const createGetTransactionByIdUseCase = (
  transactionRepository: TransactionRepository,
): GetTransactionByIdUseCase => ({
  async execute(remoteId: string): Promise<TransactionResult> {
    const normalizedRemoteId = remoteId.trim();

    if (!normalizedRemoteId) {
      return {
        success: false,
        error: TransactionValidationError("Transaction id is required."),
      };
    }

    return transactionRepository.getTransactionByRemoteId(normalizedRemoteId);
  },
});
