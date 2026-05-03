import {
  SaveTransactionPayload,
  TransactionPostingStatus,
  TransactionSourceModule,
} from "@/feature/transactions/types/transaction.entity.types";

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const normalizeMoneyPostingPayload = (
  payload: SaveTransactionPayload,
): SaveTransactionPayload => ({
  ...payload,
  remoteId: normalizeRequired(payload.remoteId),
  ownerUserRemoteId: normalizeRequired(payload.ownerUserRemoteId),
  accountRemoteId: normalizeRequired(payload.accountRemoteId),
  accountDisplayNameSnapshot: normalizeRequired(payload.accountDisplayNameSnapshot),
  title: normalizeRequired(payload.title),
  currencyCode: normalizeOptional(payload.currencyCode),
  categoryRemoteId: normalizeOptional(payload.categoryRemoteId),
  categoryNameSnapshot: normalizeOptional(payload.categoryNameSnapshot),
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
