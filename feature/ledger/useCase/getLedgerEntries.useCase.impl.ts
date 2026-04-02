import { LedgerRepository } from "@/feature/ledger/data/repository/ledger.repository";
import { LedgerEntriesResult } from "@/feature/ledger/types/ledger.entity.types";
import { LedgerValidationError } from "@/feature/ledger/types/ledger.error.types";
import { GetLedgerEntriesParams, GetLedgerEntriesUseCase } from "./getLedgerEntries.useCase";

export const createGetLedgerEntriesUseCase = (
  ledgerRepository: LedgerRepository,
): GetLedgerEntriesUseCase => ({
  async execute(params: GetLedgerEntriesParams): Promise<LedgerEntriesResult> {
    const normalizedBusinessAccountRemoteId = params.businessAccountRemoteId.trim();

    if (!normalizedBusinessAccountRemoteId) {
      return {
        success: false,
        error: LedgerValidationError("Business account context is required."),
      };
    }

    return ledgerRepository.getLedgerEntriesByBusinessAccountRemoteId(
      normalizedBusinessAccountRemoteId,
    );
  },
});
