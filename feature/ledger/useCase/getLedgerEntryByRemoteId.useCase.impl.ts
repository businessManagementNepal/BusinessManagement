import { LedgerRepository } from "@/feature/ledger/data/repository/ledger.repository";
import { LedgerEntryResult } from "@/feature/ledger/types/ledger.entity.types";
import { LedgerValidationError } from "@/feature/ledger/types/ledger.error.types";
import { GetLedgerEntryByRemoteIdUseCase } from "./getLedgerEntryByRemoteId.useCase";

export const createGetLedgerEntryByRemoteIdUseCase = (
  ledgerRepository: LedgerRepository,
): GetLedgerEntryByRemoteIdUseCase => ({
  async execute(remoteId: string): Promise<LedgerEntryResult> {
    const normalizedRemoteId = remoteId.trim();

    if (!normalizedRemoteId) {
      return {
        success: false,
        error: LedgerValidationError("Ledger entry id is required."),
      };
    }

    return ledgerRepository.getLedgerEntryByRemoteId(normalizedRemoteId);
  },
});
