import { TransactionRepository } from "@/feature/transactions/data/repository/transaction.repository";
import {
  TransactionDirection,
  SaveTransactionPayload,
  TransactionResult,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";
import { TransactionValidationError } from "@/feature/transactions/types/transaction.error.types";
import { AddTransactionUseCase } from "./addTransaction.useCase";

const normalizePayload = (
  payload: SaveTransactionPayload,
): SaveTransactionPayload => ({
  ...payload,
  remoteId: payload.remoteId.trim(),
  ownerUserRemoteId: payload.ownerUserRemoteId.trim(),
  accountRemoteId: payload.accountRemoteId.trim(),
  accountDisplayNameSnapshot: payload.accountDisplayNameSnapshot.trim(),
  title: payload.title.trim(),
  categoryLabel: payload.categoryLabel?.trim() || null,
  note: payload.note?.trim() || null,
});

const validatePayload = (payload: SaveTransactionPayload): string | null => {
  if (!payload.remoteId) {
    return "Transaction id is required.";
  }

  if (!payload.ownerUserRemoteId) {
    return "User context is required.";
  }

  if (!payload.accountRemoteId) {
    return "Please select an account.";
  }

  if (!payload.accountDisplayNameSnapshot) {
    return "Account label is required.";
  }

  if (!payload.title) {
    return "Please enter a title.";
  }

  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    return "Amount must be greater than zero.";
  }

  if (!Number.isFinite(payload.happenedAt) || payload.happenedAt <= 0) {
    return "Please enter a valid date.";
  }

  if (payload.transactionType === TransactionType.Income && payload.direction !== TransactionDirection.In) {
    return "Income must move money in.";
  }

  if (payload.transactionType === TransactionType.Expense && payload.direction !== TransactionDirection.Out) {
    return "Expense must move money out.";
  }

  if (payload.transactionType === TransactionType.Refund && ![TransactionDirection.In, TransactionDirection.Out].includes(payload.direction)) {
    return "Refund direction is invalid.";
  }

  return null;
};

export const createAddTransactionUseCase = (
  transactionRepository: TransactionRepository,
): AddTransactionUseCase => ({
  async execute(payload: SaveTransactionPayload): Promise<TransactionResult> {
    const normalizedPayload = normalizePayload(payload);
    const validationError = validatePayload(normalizedPayload);

    if (validationError) {
      return {
        success: false,
        error: TransactionValidationError(validationError),
      };
    }

    return transactionRepository.saveTransaction(normalizedPayload);
  },
});
