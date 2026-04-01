import { TransactionModel } from "../../dataSource/db/transaction.model";
import { Transaction } from "@/feature/transactions/types/transaction.entity.types";

export const mapTransactionModelToDomain = async (
  model: TransactionModel,
): Promise<Transaction> => ({
  remoteId: model.remoteId,
  ownerUserRemoteId: model.ownerUserRemoteId,
  accountRemoteId: model.accountRemoteId,
  accountDisplayNameSnapshot: model.accountDisplayNameSnapshot,
  transactionType: model.transactionType,
  direction: model.direction,
  title: model.title,
  amount: Number(model.amount),
  currencyCode: model.currencyCode,
  categoryLabel: model.categoryLabel,
  note: model.note,
  happenedAt: model.happenedAt,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});
