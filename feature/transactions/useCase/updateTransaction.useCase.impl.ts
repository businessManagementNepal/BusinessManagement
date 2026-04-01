import { createAddTransactionUseCase } from "./addTransaction.useCase.impl";
import { TransactionRepository } from "@/feature/transactions/data/repository/transaction.repository";
import { UpdateTransactionUseCase } from "./updateTransaction.useCase";

export const createUpdateTransactionUseCase = (
  transactionRepository: TransactionRepository,
): UpdateTransactionUseCase => ({
  async execute(payload) {
    const addTransactionUseCase = createAddTransactionUseCase(transactionRepository);
    return addTransactionUseCase.execute(payload);
  },
});
