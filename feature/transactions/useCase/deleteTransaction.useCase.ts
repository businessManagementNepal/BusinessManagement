import { TransactionOperationResult } from "@/feature/transactions/types/transaction.entity.types";

export interface DeleteTransactionUseCase {
  execute(remoteId: string): Promise<TransactionOperationResult>;
}
