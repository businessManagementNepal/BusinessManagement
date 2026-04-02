import { LedgerRepository } from "@/feature/ledger/data/repository/ledger.repository";
import { LedgerOperationResult } from "@/feature/ledger/types/ledger.entity.types";
import { LedgerValidationError } from "@/feature/ledger/types/ledger.error.types";
import { DeleteLedgerEntryUseCase } from "./deleteLedgerEntry.useCase";

export const createDeleteLedgerEntryUseCase = (
  ledgerRepository: LedgerRepository,
): DeleteLedgerEntryUseCase => ({
  async execute(remoteId: string): Promise<LedgerOperationResult> {
    const normalizedRemoteId = remoteId.trim();

    if (!normalizedRemoteId) {
      return {
        success: false,
        error: LedgerValidationError("Ledger entry id is required."),
      };
    }

    return ledgerRepository.deleteLedgerEntryByRemoteId(normalizedRemoteId);
  },
});
