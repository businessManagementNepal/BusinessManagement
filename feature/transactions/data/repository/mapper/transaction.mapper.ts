import {
    Transaction,
    TransactionPostingStatus,
} from "@/feature/transactions/types/transaction.entity.types";
import { TransactionModel } from "../../dataSource/db/transaction.model";

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
  postingStatus: model.postingStatus ?? TransactionPostingStatus.Posted,
  contactRemoteId: model.contactRemoteId ?? null,
  settlementMoneyAccountRemoteId: model.settlementMoneyAccountRemoteId,
  settlementMoneyAccountDisplayNameSnapshot:
    model.settlementMoneyAccountDisplayNameSnapshot,
  sourceModule: model.sourceModule,
  sourceRemoteId: model.sourceRemoteId,
  sourceAction: model.sourceAction,
  idempotencyKey: model.idempotencyKey,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});
