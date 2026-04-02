import { LedgerEntryResult } from "@/feature/ledger/types/ledger.entity.types";

export interface GetLedgerEntryByRemoteIdUseCase {
  execute(remoteId: string): Promise<LedgerEntryResult>;
}
