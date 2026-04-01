import { SaveTransactionPayload, TransactionResult } from "@/feature/transactions/types/transaction.entity.types";

export interface AddTransactionUseCase {
  execute(payload: SaveTransactionPayload): Promise<TransactionResult>;
}
