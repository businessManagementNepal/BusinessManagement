import { TransactionOperationResult } from "@/feature/transactions/types/transaction.entity.types";

export interface DeleteBusinessTransactionUseCase {
  execute(remoteId: string): Promise<TransactionOperationResult>;
}
