import { LedgerEntriesResult } from "@/feature/ledger/types/ledger.entity.types";

export type GetLedgerEntriesParams = {
  businessAccountRemoteId: string;
};

export interface GetLedgerEntriesUseCase {
  execute(params: GetLedgerEntriesParams): Promise<LedgerEntriesResult>;
}
