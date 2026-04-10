import { BillingRepository } from "@/feature/billing/data/repository/billing.repository";
import { DeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase } from "./deleteBillingDocumentAllocationsBySettlementEntryRemoteId.useCase";

export const createDeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase =
  (
    repository: BillingRepository,
  ): DeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase => ({
    execute(settlementLedgerEntryRemoteId: string) {
      return repository.deleteBillingDocumentAllocationsBySettlementEntryRemoteId(
        settlementLedgerEntryRemoteId,
      );
    },
  });
