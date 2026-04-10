import {
  SaveTransactionPayload,
  TransactionResult,
} from "@/feature/transactions/types/transaction.entity.types";

export interface PostBusinessTransactionUseCase {
  execute(payload: SaveTransactionPayload): Promise<TransactionResult>;
}
