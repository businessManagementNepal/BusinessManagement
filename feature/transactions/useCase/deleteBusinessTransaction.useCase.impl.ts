import { MoneyAccountModel } from "@/feature/accounts/data/dataSource/db/moneyAccount.model";
import { MoneyAccountSyncStatus } from "@/feature/accounts/types/moneyAccount.types";
import { TransactionModel } from "@/feature/transactions/data/dataSource/db/transaction.model";
import {
  TransactionDirection,
  TransactionOperationResult,
  TransactionPostingStatus,
  TransactionSyncStatus,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  TransactionDatabaseError,
  TransactionError,
  TransactionUnknownError,
  TransactionValidationError,
} from "@/feature/transactions/types/transaction.error.types";
import { Collection, Database, Q } from "@nozbe/watermelondb";
import { DeleteBusinessTransactionUseCase } from "./deleteBusinessTransaction.useCase";

const TRANSACTIONS_TABLE = "transactions";
const MONEY_ACCOUNTS_TABLE = "money_accounts";

const setTransactionUpdatedAt = (record: TransactionModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateTransactionSyncStatusOnMutation = (record: TransactionModel) => {
  if (!record.recordSyncStatus) {
    record.recordSyncStatus = TransactionSyncStatus.PendingUpdate;
    return;
  }

  if (record.recordSyncStatus === TransactionSyncStatus.Synced) {
    record.recordSyncStatus = TransactionSyncStatus.PendingUpdate;
  }
};

const setMoneyAccountUpdatedAt = (record: MoneyAccountModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const updateMoneyAccountSyncStatusOnMutation = (record: MoneyAccountModel) => {
  if (!record.recordSyncStatus) {
    record.recordSyncStatus = MoneyAccountSyncStatus.PendingUpdate;
    return;
  }

  if (record.recordSyncStatus === MoneyAccountSyncStatus.Synced) {
    record.recordSyncStatus = MoneyAccountSyncStatus.PendingUpdate;
  }
};

const toSignedAmount = (amount: number, direction: string): number => {
  return direction === TransactionDirection.In ? amount : amount * -1;
};

const roundToCurrencyScale = (value: number): number => {
  return Number(value.toFixed(2));
};

const adjustMoneyAccountBalance = async ({
  collection,
  remoteId,
  delta,
}: {
  collection: Collection<MoneyAccountModel>;
  remoteId: string | null;
  delta: number;
}): Promise<void> => {
  if (!remoteId || Math.abs(delta) < 0.000001) {
    return;
  }

  const matching = await collection
    .query(Q.where("remote_id", remoteId), Q.where("deleted_at", Q.eq(null)))
    .fetch();

  const moneyAccount = matching[0];

  if (!moneyAccount) {
    throw new Error("Settlement money account not found.");
  }

  await moneyAccount.update((record) => {
    record.currentBalance = roundToCurrencyScale(record.currentBalance + delta);
    updateMoneyAccountSyncStatusOnMutation(record);
    setMoneyAccountUpdatedAt(record, Date.now());
  });
};

const mapError = (error: unknown): TransactionError => {
  if (!(error instanceof Error)) {
    return TransactionUnknownError;
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("database") ||
    message.includes("adapter") ||
    message.includes("table") ||
    message.includes("schema")
  ) {
    return {
      ...TransactionDatabaseError,
      message: error.message,
    };
  }

  return {
    ...TransactionUnknownError,
    message: error.message,
  };
};

export const createDeleteBusinessTransactionUseCase = (
  database: Database,
): DeleteBusinessTransactionUseCase => ({
  async execute(remoteId: string): Promise<TransactionOperationResult> {
    const normalizedRemoteId = remoteId.trim();

    if (!normalizedRemoteId) {
      return {
        success: false,
        error: TransactionValidationError("Transaction id is required."),
      };
    }

    try {
      const transactionsCollection = database.get<TransactionModel>(TRANSACTIONS_TABLE);
      const moneyAccountsCollection = database.get<MoneyAccountModel>(
        MONEY_ACCOUNTS_TABLE,
      );

      const matching = await transactionsCollection
        .query(Q.where("remote_id", normalizedRemoteId))
        .fetch();

      const existing = matching[0] ?? null;

      if (!existing || existing.deletedAt !== null) {
        return {
          success: true,
          value: false,
        };
      }

      await database.write(async () => {
        const signedAmount =
          (existing.postingStatus ?? TransactionPostingStatus.Posted) ===
          TransactionPostingStatus.Posted
            ? toSignedAmount(existing.amount, existing.direction)
            : 0;

        await adjustMoneyAccountBalance({
          collection: moneyAccountsCollection,
          remoteId: existing.settlementMoneyAccountRemoteId,
          delta: signedAmount * -1,
        });

        await existing.update((record) => {
          record.deletedAt = Date.now();
          record.postingStatus = TransactionPostingStatus.Voided;
          updateTransactionSyncStatusOnMutation(record);
          setTransactionUpdatedAt(record, Date.now());
        });
      });

      return {
        success: true,
        value: true,
      };
    } catch (error) {
      return {
        success: false,
        error: mapError(error),
      };
    }
  },
});
