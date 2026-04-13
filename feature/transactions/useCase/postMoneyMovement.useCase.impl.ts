import { MoneyPostingRepository } from "@/feature/transactions/data/repository/moneyPosting.repository";
import {
  SaveTransactionPayload,
  TransactionDirection,
  TransactionPostingStatus,
  TransactionResult,
  TransactionSourceModule,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { TransactionValidationError } from "@/feature/transactions/types/transaction.error.types";
import { PostMoneyMovementUseCase } from "./postMoneyMovement.useCase";

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizePayload = (
  payload: SaveTransactionPayload,
): SaveTransactionPayload => ({
  ...payload,
  remoteId: normalizeRequired(payload.remoteId),
  ownerUserRemoteId: normalizeRequired(payload.ownerUserRemoteId),
  accountRemoteId: normalizeRequired(payload.accountRemoteId),
  accountDisplayNameSnapshot: normalizeRequired(
    payload.accountDisplayNameSnapshot,
  ),
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
  contactRemoteId: normalizeOptional(payload.contactRemoteId),
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

  if (
    payload.transactionType === TransactionType.Income &&
    payload.direction !== TransactionDirection.In
  ) {
    return "Income must move money in.";
  }

  if (
    payload.transactionType === TransactionType.Expense &&
    payload.direction !== TransactionDirection.Out
  ) {
    return "Expense must move money out.";
  }

  return null;
};

export const createPostMoneyMovementUseCase = (
  repository: MoneyPostingRepository,
): PostMoneyMovementUseCase => ({
  async execute(payload: SaveTransactionPayload): Promise<TransactionResult> {
    const normalizedPayload = normalizePayload(payload);
    const validationError = validatePayload(normalizedPayload);

    if (validationError) {
      return {
        success: false,
        error: TransactionValidationError(validationError),
      };
    }

    return repository.postMoneyMovement(normalizedPayload);
  },
});
