import { BillingOperationResult } from "@/feature/billing/types/billing.types";
import { PayBillingDocumentPayload } from "@/feature/billing/useCase/payBillingDocument.useCase";

export interface RunBillingSettlementUseCase {
  execute(payload: PayBillingDocumentPayload): Promise<BillingOperationResult>;
}
