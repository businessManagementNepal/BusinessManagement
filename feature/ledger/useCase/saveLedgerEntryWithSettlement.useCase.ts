import {
    LedgerEntry,
    LedgerEntryResult,
    SaveLedgerEntryPayload,
} from "@/feature/ledger/types/ledger.entity.types";

export const INVALID_LEDGER_SETTLEMENT_ACCOUNT_MESSAGE =
  "Choose a valid active money account.";

export type SaveLedgerEntryWithSettlementMode = "create" | "update";

export type LedgerSettlementAllocationCandidate = {
  remoteId: string;
  outstandingAmount: number;
};

export type ExternalSettlementTransactionContext = {
  remoteId: string;
  settlementMoneyAccountRemoteId: string;
  settlementMoneyAccountDisplayNameSnapshot: string;
  paymentMode: string;
};

export type SaveLedgerEntryWithSettlementPayload = {
  mode: SaveLedgerEntryWithSettlementMode;
  businessAccountDisplayName: string;
  selectedSettlementAccountRemoteId: string | null;
  ledgerEntry: SaveLedgerEntryPayload;
  existingLedgerEntries: readonly LedgerEntry[];
  settlementCandidates: readonly LedgerSettlementAllocationCandidate[];
  externalSettlementTransaction?: ExternalSettlementTransactionContext | null;
};

export interface SaveLedgerEntryWithSettlementUseCase {
  execute(
    payload: SaveLedgerEntryWithSettlementPayload,
  ): Promise<LedgerEntryResult>;
}
