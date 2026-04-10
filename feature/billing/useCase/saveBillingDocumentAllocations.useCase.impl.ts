import { BillingRepository } from "@/feature/billing/data/repository/billing.repository";
import { SaveBillingDocumentAllocationsUseCase } from "./saveBillingDocumentAllocations.useCase";

export const createSaveBillingDocumentAllocationsUseCase = (
  repository: BillingRepository,
): SaveBillingDocumentAllocationsUseCase => ({
  execute(payloads) {
    return repository.saveBillingDocumentAllocations(payloads);
  },
});
