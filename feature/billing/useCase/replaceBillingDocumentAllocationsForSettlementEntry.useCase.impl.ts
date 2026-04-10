import { BillingRepository } from "@/feature/billing/data/repository/billing.repository";
import { ReplaceBillingDocumentAllocationsForSettlementEntryUseCase } from "./replaceBillingDocumentAllocationsForSettlementEntry.useCase";

export const createReplaceBillingDocumentAllocationsForSettlementEntryUseCase =
  (
    repository: BillingRepository,
  ): ReplaceBillingDocumentAllocationsForSettlementEntryUseCase => ({
    execute(params) {
      return repository.replaceBillingDocumentAllocationsForSettlementEntry(
        params,
      );
    },
  });
