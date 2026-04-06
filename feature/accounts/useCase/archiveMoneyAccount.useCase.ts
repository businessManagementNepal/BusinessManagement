import { MoneyAccountOperationResult } from "@/feature/accounts/types/moneyAccount.types";

export interface ArchiveMoneyAccountUseCase {
  execute(remoteId: string): Promise<MoneyAccountOperationResult>;
}
