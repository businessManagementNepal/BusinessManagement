import { LedgerRepository } from "@/feature/ledger/data/repository/ledger.repository";
import { LedgerEntriesResult } from "@/feature/ledger/types/ledger.entity.types";
import { LedgerValidationError } from "@/feature/ledger/types/ledger.error.types";
import {
  GetLedgerEntriesByPartyParams,
  GetLedgerEntriesByPartyUseCase,
} from "./getLedgerEntriesByParty.useCase";

export const createGetLedgerEntriesByPartyUseCase = (
  ledgerRepository: LedgerRepository,
): GetLedgerEntriesByPartyUseCase => ({
  async execute(params: GetLedgerEntriesByPartyParams): Promise<LedgerEntriesResult> {
    const normalizedBusinessAccountRemoteId = params.businessAccountRemoteId.trim();
    const normalizedPartyName = params.partyName.trim().toLowerCase();

    if (!normalizedBusinessAccountRemoteId) {
      return {
        success: false,
        error: LedgerValidationError("Business account context is required."),
      };
    }

    if (!normalizedPartyName) {
      return {
        success: false,
        error: LedgerValidationError("Party name is required."),
      };
    }

    const result = await ledgerRepository.getLedgerEntriesByBusinessAccountRemoteId(
      normalizedBusinessAccountRemoteId,
    );

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      value: result.value.filter(
        (entry) => entry.partyName.trim().toLowerCase() === normalizedPartyName,
      ),
    };
  },
});
