import { MoneyAccountModel } from "@/feature/accounts/data/dataSource/db/moneyAccount.model";
import { MoneyAccountSyncStatus } from "@/feature/accounts/types/moneyAccount.types";
import { TransactionModel } from "@/feature/transactions/data/dataSource/db/transaction.model";
import { mapTransactionModelToDomain } from "@/feature/transactions/data/repository/mapper/transaction.mapper";
import {
  SaveTransactionPayload,
  TransactionDirection,
  TransactionPostingStatus,
  TransactionResult,
  TransactionSourceModule,
  TransactionSyncStatus,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  TransactionDatabaseError,
  TransactionError,
  TransactionUnknownError,
  TransactionValidationError,
} from "@/feature/transactions/types/transaction.error.types";
import { Collection, Database, Q } from "@nozbe/watermelondb";
import { PostBusinessTransactionUseCase } from "./postBusinessTransaction.useCase";

const TRANSACTIONS_TABLE = "transactions";
const MONEY_ACCOUNTS_TABLE = "money_accounts";

const setTransactionCreatedAndUpdatedAt = (record: TransactionModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

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

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizePayload = (payload: SaveTransactionPayload): SaveTransactionPayload => ({
  ...payload,
  remoteId: normalizeRequired(payload.remoteId),
  ownerUserRemoteId: normalizeRequired(payload.ownerUserRemoteId),
  accountRemoteId: normalizeRequired(payload.accountRemoteId),
  accountDisplayNameSnapshot: normalizeRequired(payload.accountDisplayNameSnapshot),
  title: normalizeRequired(payload.title),
  currencyCode: normalizeOptional(payload.currencyCode),
  categoryLabel: normalizeOptional(payload.categoryLabel),
  note: normalizeOptional(payload.note),
  settlementMoneyAccountRemoteId: normalizeOptional(
    payload.settlementMoneyAccountRemoteId,
  ),
  settlementMoneyAccountDisplayNameSnapshot: normalizeOptional(
    payload.settlementMoneyAccountDisplayNameSnapshot,
  ),
  sourceModule: payload.sourceModule ?? TransactionSourceModule.Manual,
  sourceRemoteId: normalizeOptional(payload.sourceRemoteId),
  sourceAction: normalizeOptional(payload.sourceAction),
  idempotencyKey: normalizeOptional(payload.idempotencyKey),
  postingStatus: payload.postingStatus ?? TransactionPostingStatus.Posted,
});

const validatePayload = (payload: SaveTransactionPayload): string | null => {
  if (!payload.remoteId) {
    return "Transaction id is required.";
  }

  if (!payload.ownerUserRemoteId) {
    return "User context is required.";
  }

  if (!payload.accountRemoteId) {
    return "Active account is required.";
  }

  if (!payload.accountDisplayNameSnapshot) {
    return "Account display name is required.";
  }

  if (!payload.title) {
    return "Transaction title is required.";
  }

  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    return "Amount must be greater than zero.";
  }

  if (!Number.isFinite(payload.happenedAt) || payload.happenedAt <= 0) {
    return "Transaction date is required.";
  }

  return null;
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

export const createPostBusinessTransactionUseCase = (
  database: Database,
): PostBusinessTransactionUseCase => ({
  async execute(payload: SaveTransactionPayload): Promise<TransactionResult> {
    const normalizedPayload = normalizePayload(payload);
    const validationError = validatePayload(normalizedPayload);

    if (validationError) {
      return {
        success: false,
        error: TransactionValidationError(validationError),
      };
    }

    try {
      const transactionsCollection = database.get<TransactionModel>(TRANSACTIONS_TABLE);
      const moneyAccountsCollection = database.get<MoneyAccountModel>(
        MONEY_ACCOUNTS_TABLE,
      );

      const existingByRemoteId = await transactionsCollection
        .query(Q.where("remote_id", normalizedPayload.remoteId))
        .fetch();
      let existing = existingByRemoteId[0] ?? null;

      if (!existing && normalizedPayload.idempotencyKey) {
        const existingByIdempotency = await transactionsCollection
          .query(
            Q.where("idempotency_key", normalizedPayload.idempotencyKey),
            Q.where("deleted_at", Q.eq(null)),
          )
          .fetch();

        existing = existingByIdempotency[0] ?? null;

        if (existing) {
          return {
            success: true,
            value: await mapTransactionModelToDomain(existing),
          };
        }
      }

      let persisted!: TransactionModel;

      await database.write(async () => {
        if (existing) {
          const oldPostingStatus =
            existing.postingStatus ?? TransactionPostingStatus.Posted;
          const oldSignedAmount =
            oldPostingStatus === TransactionPostingStatus.Posted
              ? toSignedAmount(existing.amount, existing.direction)
              : 0;
          const newPostingStatus =
            normalizedPayload.postingStatus ?? TransactionPostingStatus.Posted;
          const newSignedAmount =
            newPostingStatus === TransactionPostingStatus.Posted
              ? toSignedAmount(
                  normalizedPayload.amount,
                  normalizedPayload.direction,
                )
              : 0;

          await adjustMoneyAccountBalance({
            collection: moneyAccountsCollection,
            remoteId: existing.settlementMoneyAccountRemoteId,
            delta: oldSignedAmount * -1,
          });

          await adjustMoneyAccountBalance({
            collection: moneyAccountsCollection,
            remoteId: normalizedPayload.settlementMoneyAccountRemoteId ?? null,
            delta: newSignedAmount,
          });

          await existing.update((record) => {
            record.ownerUserRemoteId = normalizedPayload.ownerUserRemoteId;
            record.accountRemoteId = normalizedPayload.accountRemoteId;
            record.accountDisplayNameSnapshot =
              normalizedPayload.accountDisplayNameSnapshot;
            record.transactionType = normalizedPayload.transactionType;
            record.direction = normalizedPayload.direction;
            record.title = normalizedPayload.title;
            record.amount = normalizedPayload.amount;
            record.currencyCode = normalizedPayload.currencyCode;
            record.categoryLabel = normalizedPayload.categoryLabel;
            record.note = normalizedPayload.note;
            record.happenedAt = normalizedPayload.happenedAt;
            record.settlementMoneyAccountRemoteId =
              normalizedPayload.settlementMoneyAccountRemoteId ?? null;
            record.settlementMoneyAccountDisplayNameSnapshot =
              normalizedPayload.settlementMoneyAccountDisplayNameSnapshot ?? null;
            record.sourceModule = normalizedPayload.sourceModule ?? null;
            record.sourceRemoteId = normalizedPayload.sourceRemoteId ?? null;
            record.sourceAction = normalizedPayload.sourceAction ?? null;
            record.idempotencyKey = normalizedPayload.idempotencyKey ?? null;
            record.postingStatus = newPostingStatus;
            record.deletedAt = null;
            updateTransactionSyncStatusOnMutation(record);
            setTransactionUpdatedAt(record, Date.now());
          });

          persisted = existing;
          return;
        }

        persisted = await transactionsCollection.create((record) => {
          const now = Date.now();

          record.remoteId = normalizedPayload.remoteId;
          record.ownerUserRemoteId = normalizedPayload.ownerUserRemoteId;
          record.accountRemoteId = normalizedPayload.accountRemoteId;
          record.accountDisplayNameSnapshot =
            normalizedPayload.accountDisplayNameSnapshot;
          record.transactionType = normalizedPayload.transactionType;
          record.direction = normalizedPayload.direction;
          record.title = normalizedPayload.title;
          record.amount = normalizedPayload.amount;
          record.currencyCode = normalizedPayload.currencyCode;
          record.categoryLabel = normalizedPayload.categoryLabel;
          record.note = normalizedPayload.note;
          record.happenedAt = normalizedPayload.happenedAt;
          record.settlementMoneyAccountRemoteId =
            normalizedPayload.settlementMoneyAccountRemoteId ?? null;
          record.settlementMoneyAccountDisplayNameSnapshot =
            normalizedPayload.settlementMoneyAccountDisplayNameSnapshot ?? null;
          record.sourceModule = normalizedPayload.sourceModule ?? null;
          record.sourceRemoteId = normalizedPayload.sourceRemoteId ?? null;
          record.sourceAction = normalizedPayload.sourceAction ?? null;
          record.idempotencyKey = normalizedPayload.idempotencyKey ?? null;
          record.postingStatus =
            normalizedPayload.postingStatus ?? TransactionPostingStatus.Posted;
          record.recordSyncStatus = TransactionSyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;

          setTransactionCreatedAndUpdatedAt(record, now);
        });

        const signedAmount =
          normalizedPayload.postingStatus === TransactionPostingStatus.Voided
            ? 0
            : toSignedAmount(normalizedPayload.amount, normalizedPayload.direction);

        await adjustMoneyAccountBalance({
          collection: moneyAccountsCollection,
          remoteId: normalizedPayload.settlementMoneyAccountRemoteId ?? null,
          delta: signedAmount,
        });
      });

      return {
        success: true,
        value: await mapTransactionModelToDomain(persisted),
      };
    } catch (error) {
      return {
        success: false,
        error: mapError(error),
      };
    }
  },
});
