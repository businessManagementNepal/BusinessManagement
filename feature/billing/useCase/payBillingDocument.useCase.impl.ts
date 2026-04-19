import { RunBillingSettlementUseCase } from "@/feature/billing/workflow/billingSettlement/useCase/runBillingSettlement.useCase";
import {
  PayBillingDocumentPayload,
  PayBillingDocumentUseCase,
} from "./payBillingDocument.useCase";

export const createPayBillingDocumentUseCase = (
  runBillingSettlementUseCase: RunBillingSettlementUseCase,
): PayBillingDocumentUseCase => ({
  async execute(payload: PayBillingDocumentPayload) {
    return runBillingSettlementUseCase.execute(payload);
  },
});
