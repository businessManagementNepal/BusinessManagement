import { LedgerOperationResult } from "@/feature/ledger/types/ledger.entity.types";

export interface DeleteLedgerEntryUseCase {
  execute(remoteId: string): Promise<LedgerOperationResult>;
}
