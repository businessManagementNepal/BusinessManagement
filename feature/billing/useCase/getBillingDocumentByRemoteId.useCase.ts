import { BillingDocumentResult } from "@/feature/billing/types/billing.types";

export interface GetBillingDocumentByRemoteIdUseCase {
  execute(remoteId: string): Promise<BillingDocumentResult>;
}
