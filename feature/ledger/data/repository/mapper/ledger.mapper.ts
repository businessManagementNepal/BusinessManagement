import { LedgerEntryModel } from "@/feature/ledger/data/dataSource/db/ledger.model";
import { LedgerEntry } from "@/feature/ledger/types/ledger.entity.types";

export const mapLedgerEntryModelToDomain = async (
  model: LedgerEntryModel,
): Promise<LedgerEntry> => {
  return {
    remoteId: model.remoteId,
    businessAccountRemoteId: model.businessAccountRemoteId,
    ownerUserRemoteId: model.ownerUserRemoteId,
    partyName: model.partyName,
    partyPhone: model.partyPhone,
    entryType: model.entryType,
    balanceDirection: model.balanceDirection,
    title: model.title,
    amount: model.amount,
    currencyCode: model.currencyCode,
    note: model.note,
    happenedAt: model.happenedAt,
    dueAt: model.dueAt,
    settlementAccountRemoteId: model.settlementAccountRemoteId,
    settlementAccountDisplayNameSnapshot: model.settlementAccountDisplayNameSnapshot,
    createdAt: model.createdAt.getTime(),
    updatedAt: model.updatedAt.getTime(),
  };
};
