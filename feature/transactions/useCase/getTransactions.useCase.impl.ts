import { TransactionRepository } from "@/feature/transactions/data/repository/transaction.repository";
import {
  TransactionValidationError,
} from "@/feature/transactions/types/transaction.error.types";
import { TransactionsResult } from "@/feature/transactions/types/transaction.entity.types";
import { GetTransactionsParams, GetTransactionsUseCase } from "./getTransactions.useCase";

export const createGetTransactionsUseCase = (
  transactionRepository: TransactionRepository,
): GetTransactionsUseCase => ({
  async execute(params: GetTransactionsParams): Promise<TransactionsResult> {
    const normalizedOwnerUserRemoteId = params.ownerUserRemoteId.trim();

    if (!normalizedOwnerUserRemoteId) {
      return {
        success: false,
        error: TransactionValidationError("User context is required."),
      };
    }

    const result = await transactionRepository.getTransactionsByOwnerUserRemoteId(
      normalizedOwnerUserRemoteId,
    );

    if (!result.success) {
      return result;
    }

    const normalizedAccountRemoteId = params.accountRemoteId?.trim();

    if (!normalizedAccountRemoteId) {
      return result;
    }

    return {
      success: true,
      value: result.value.filter(
        (transaction) => transaction.accountRemoteId === normalizedAccountRemoteId,
      ),
    };
  },
});
