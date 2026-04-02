import { Result } from "@/shared/types/result.types";
import { SaveLedgerEntryPayload } from "@/feature/ledger/types/ledger.entity.types";
import { LedgerEntryModel } from "./db/ledger.model";

export interface LedgerDatasource {
  saveLedgerEntry(payload: SaveLedgerEntryPayload): Promise<Result<LedgerEntryModel>>;
  getLedgerEntriesByBusinessAccountRemoteId(
    businessAccountRemoteId: string,
  ): Promise<Result<LedgerEntryModel[]>>;
  getLedgerEntryByRemoteId(
    remoteId: string,
  ): Promise<Result<LedgerEntryModel | null>>;
  deleteLedgerEntryByRemoteId(remoteId: string): Promise<Result<boolean>>;
}
