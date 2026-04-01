import { TransactionRepository } from "@/feature/transactions/data/repository/transaction.repository";
import { TransactionValidationError } from "@/feature/transactions/types/transaction.error.types";
import { TransactionOperationResult } from "@/feature/transactions/types/transaction.entity.types";
import { DeleteTransactionUseCase } from "./deleteTransaction.useCase";

export const createDeleteTransactionUseCase = (
  transactionRepository: TransactionRepository,
): DeleteTransactionUseCase => ({
  async execute(remoteId: string): Promise<TransactionOperationResult> {
    const normalizedRemoteId = remoteId.trim();

    if (!normalizedRemoteId) {
      return {
        success: false,
        error: TransactionValidationError("Transaction id is required."),
      };
    }

    return transactionRepository.deleteTransactionByRemoteId(normalizedRemoteId);
  },
});
