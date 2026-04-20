import {
  TransactionResult,
  TransactionsResult,
} from "@/feature/transactions/types/transaction.entity.types";

export interface TransactionRepository {
  getTransactionsByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<TransactionsResult>;
  getPostedTransactionsByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<TransactionsResult>;
  getPostedOrderTransactions(params: {
    accountRemoteId: string;
    orderRemoteId: string;
  }): Promise<TransactionsResult>;
  getTransactionByRemoteId(remoteId: string): Promise<TransactionResult>;
}
