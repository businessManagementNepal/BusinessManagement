import { TransactionDirection } from "@/feature/transactions/types/transaction.entity.types";
import { MoneyAccountProjectionDatasource } from "../data/dataSource/moneyAccountProjection.datasource";
import { RecalculateMoneyAccountBalancesUseCase } from "./recalculateMoneyAccountBalances.useCase";

const roundToCurrencyScale = (value: number): number => {
  return Number(value.toFixed(2));
};

export const createRecalculateMoneyAccountBalancesUseCase = (
  datasource: MoneyAccountProjectionDatasource,
): RecalculateMoneyAccountBalancesUseCase => ({
  async execute(input) {
    const accountsResult =
      await datasource.getActiveMoneyAccountsByScopeAccountRemoteId(
        input.accountRemoteId,
      );
    if (!accountsResult.success) {
      return accountsResult;
    }

    const transactionsResult =
      await datasource.getPostedTransactionsByAccountRemoteId(
        input.accountRemoteId,
      );
    if (!transactionsResult.success) {
      return transactionsResult;
    }

    const balancesByRemoteId: Record<string, number> = Object.fromEntries(
      accountsResult.value.map((account) => [account.remoteId, 0]),
    );

    for (const transaction of transactionsResult.value) {
      const moneyAccountRemoteId = transaction.settlementMoneyAccountRemoteId;
      if (!moneyAccountRemoteId) {
        continue;
      }

      const currentBalance = balancesByRemoteId[moneyAccountRemoteId] ?? 0;
      const delta =
        transaction.direction === TransactionDirection.In
          ? transaction.amount
          : -transaction.amount;

      balancesByRemoteId[moneyAccountRemoteId] = roundToCurrencyScale(
        currentBalance + delta,
      );
    }

    return datasource.replaceMoneyAccountBalances(balancesByRemoteId);
  },
});
