import { Result } from "@/shared/types/result.types";
import { SaveMoneyAccountPayload } from "@/feature/accounts/types/moneyAccount.types";
import { MoneyAccountModel } from "./db/moneyAccount.model";

export interface MoneyAccountDatasource {
  saveMoneyAccount(
    payload: SaveMoneyAccountPayload,
  ): Promise<Result<MoneyAccountModel>>;
  archiveMoneyAccountByRemoteId(remoteId: string): Promise<Result<boolean>>;
  getMoneyAccountsByScopeAccountRemoteId(
    scopeAccountRemoteId: string,
  ): Promise<Result<MoneyAccountModel[]>>;
  getMoneyAccountByRemoteId(
    remoteId: string,
  ): Promise<Result<MoneyAccountModel | null>>;
}
