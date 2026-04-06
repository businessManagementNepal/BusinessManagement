import { MoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository";
import {
  MoneyAccountOperationResult,
  MoneyAccountValidationError,
} from "@/feature/accounts/types/moneyAccount.types";
import { ArchiveMoneyAccountUseCase } from "./archiveMoneyAccount.useCase";

export const createArchiveMoneyAccountUseCase = (
  repository: MoneyAccountRepository,
): ArchiveMoneyAccountUseCase => ({
  async execute(remoteId: string): Promise<MoneyAccountOperationResult> {
    const normalizedRemoteId = remoteId.trim();
    if (!normalizedRemoteId) {
      return {
        success: false,
        error: MoneyAccountValidationError("Money account remote id is required."),
      };
    }

    return repository.archiveMoneyAccountByRemoteId(normalizedRemoteId);
  },
});
