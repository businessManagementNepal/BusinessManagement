import { Result } from "@/shared/types/result.types";
import { SaveTransactionPayload } from "@/feature/transactions/types/transaction.entity.types";
import { TransactionModel } from "./db/transaction.model";

export interface TransactionDatasource {
  saveTransaction(payload: SaveTransactionPayload): Promise<Result<TransactionModel>>;
  getTransactionsByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<Result<TransactionModel[]>>;
  getTransactionByRemoteId(
    remoteId: string,
  ): Promise<Result<TransactionModel | null>>;
  deleteTransactionByRemoteId(remoteId: string): Promise<Result<boolean>>;
}
