import {
  LedgerEntriesResult,
  LedgerEntryResult,
  LedgerOperationResult,
  SaveLedgerEntryPayload,
} from "@/feature/ledger/types/ledger.entity.types";

export interface LedgerRepository {
  saveLedgerEntry(payload: SaveLedgerEntryPayload): Promise<LedgerEntryResult>;
  getLedgerEntriesByBusinessAccountRemoteId(
    businessAccountRemoteId: string,
  ): Promise<LedgerEntriesResult>;
  getLedgerEntryByRemoteId(remoteId: string): Promise<LedgerEntryResult>;
  deleteLedgerEntryByRemoteId(remoteId: string): Promise<LedgerOperationResult>;
}
