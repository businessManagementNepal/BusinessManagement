import { SaveTransactionPayload, TransactionResult } from "@/feature/transactions/types/transaction.entity.types";

export interface UpdateTransactionUseCase {
  execute(payload: SaveTransactionPayload): Promise<TransactionResult>;
}
