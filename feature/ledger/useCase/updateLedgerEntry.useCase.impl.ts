import { LedgerRepository } from "@/feature/ledger/data/repository/ledger.repository";
import { LedgerEntryResult, SaveLedgerEntryPayload } from "@/feature/ledger/types/ledger.entity.types";
import { LedgerValidationError } from "@/feature/ledger/types/ledger.error.types";
import { UpdateLedgerEntryUseCase } from "./updateLedgerEntry.useCase";

export const createUpdateLedgerEntryUseCase = (
  ledgerRepository: LedgerRepository,
): UpdateLedgerEntryUseCase => ({
  async execute(payload: SaveLedgerEntryPayload): Promise<LedgerEntryResult> {
    if (!payload.remoteId.trim()) {
      return {
        success: false,
        error: LedgerValidationError("Ledger entry id is required."),
      };
    }

    if (!payload.businessAccountRemoteId.trim()) {
      return {
        success: false,
        error: LedgerValidationError("Business account is required."),
      };
    }

    if (!payload.ownerUserRemoteId.trim()) {
      return {
        success: false,
        error: LedgerValidationError("User context is required."),
      };
    }

    if (!payload.partyName.trim()) {
      return {
        success: false,
        error: LedgerValidationError("Party name is required."),
      };
    }

    if (!payload.title.trim()) {
      return {
        success: false,
        error: LedgerValidationError("Entry title is required."),
      };
    }

    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      return {
        success: false,
        error: LedgerValidationError("Amount must be greater than zero."),
      };
    }

    return ledgerRepository.saveLedgerEntry(payload);
  },
});
