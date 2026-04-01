import {
  SaveTransactionPayload,
  TransactionOperationResult,
  TransactionResult,
  TransactionsResult,
} from "@/feature/transactions/types/transaction.entity.types";

export interface TransactionRepository {
  saveTransaction(payload: SaveTransactionPayload): Promise<TransactionResult>;
  getTransactionsByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<TransactionsResult>;
  getTransactionByRemoteId(remoteId: string): Promise<TransactionResult>;
  deleteTransactionByRemoteId(
    remoteId: string,
  ): Promise<TransactionOperationResult>;
}
