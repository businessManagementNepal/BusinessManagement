import { MoneyAccountModel } from "@/feature/accounts/data/dataSource/db/moneyAccount.model";
import { TransactionModel } from "@/feature/transactions/data/dataSource/db/transaction.model";
import { Result } from "@/shared/types/result.types";

export interface MoneyAccountProjectionDatasource {
  getActiveMoneyAccountsByScopeAccountRemoteId(
    scopeAccountRemoteId: string,
  ): Promise<Result<MoneyAccountModel[]>>;

  getPostedTransactionsByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<TransactionModel[]>>;

  replaceMoneyAccountBalances(
    balancesByRemoteId: Readonly<Record<string, number>>,
  ): Promise<Result<boolean>>;
}
