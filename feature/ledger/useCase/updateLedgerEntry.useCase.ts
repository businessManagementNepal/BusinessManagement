import { LedgerEntryResult, SaveLedgerEntryPayload } from "@/feature/ledger/types/ledger.entity.types";

export interface UpdateLedgerEntryUseCase {
  execute(payload: SaveLedgerEntryPayload): Promise<LedgerEntryResult>;
}
