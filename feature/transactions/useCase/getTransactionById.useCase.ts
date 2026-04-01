import { TransactionResult } from "@/feature/transactions/types/transaction.entity.types";

export interface GetTransactionByIdUseCase {
  execute(remoteId: string): Promise<TransactionResult>;
}
