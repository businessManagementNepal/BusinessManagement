import { TransactionModel } from "../../dataSource/db/transaction.model";
import {
  Transaction,
  TransactionPostingStatus,
} from "@/feature/transactions/types/transaction.entity.types";

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
  settlementMoneyAccountRemoteId: model.settlementMoneyAccountRemoteId,
  settlementMoneyAccountDisplayNameSnapshot:
    model.settlementMoneyAccountDisplayNameSnapshot,
  sourceModule: model.sourceModule,
  sourceRemoteId: model.sourceRemoteId,
  sourceAction: model.sourceAction,
  idempotencyKey: model.idempotencyKey,
  postingStatus: model.postingStatus ?? TransactionPostingStatus.Posted,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});
