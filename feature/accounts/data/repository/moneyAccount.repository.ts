import {
  MoneyAccountOperationResult,
  MoneyAccountResult,
  MoneyAccountsResult,
  SaveMoneyAccountPayload,
} from "@/feature/accounts/types/moneyAccount.types";

export interface MoneyAccountRepository {
  saveMoneyAccount(payload: SaveMoneyAccountPayload): Promise<MoneyAccountResult>;
  archiveMoneyAccountByRemoteId(
    remoteId: string,
  ): Promise<MoneyAccountOperationResult>;
  getMoneyAccountsByScopeAccountRemoteId(
    scopeAccountRemoteId: string,
  ): Promise<MoneyAccountsResult>;
  getMoneyAccountByRemoteId(remoteId: string): Promise<MoneyAccountResult>;
}
