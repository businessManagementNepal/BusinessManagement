import { BillingRepository } from "@/feature/billing/data/repository/billing.repository";
import { GetBillingDocumentByRemoteIdUseCase } from "./getBillingDocumentByRemoteId.useCase";

export const createGetBillingDocumentByRemoteIdUseCase = (
  repository: BillingRepository,
): GetBillingDocumentByRemoteIdUseCase => ({
  execute(remoteId: string) {
    return repository.getBillingDocumentByRemoteId(remoteId.trim());
  },
});
