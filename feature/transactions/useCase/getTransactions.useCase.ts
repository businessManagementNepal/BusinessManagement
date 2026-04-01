import { TransactionsResult } from "@/feature/transactions/types/transaction.entity.types";

export type GetTransactionsParams = {
  ownerUserRemoteId: string;
  accountRemoteId?: string | null;
};

export interface GetTransactionsUseCase {
  execute(params: GetTransactionsParams): Promise<TransactionsResult>;
}
