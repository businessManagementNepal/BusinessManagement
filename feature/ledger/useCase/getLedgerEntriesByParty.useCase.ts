import { LedgerEntriesResult } from "@/feature/ledger/types/ledger.entity.types";

export type GetLedgerEntriesByPartyParams = {
  businessAccountRemoteId: string;
  partyName: string;
};

export interface GetLedgerEntriesByPartyUseCase {
  execute(params: GetLedgerEntriesByPartyParams): Promise<LedgerEntriesResult>;
}
