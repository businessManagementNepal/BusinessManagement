import { RunOrderCommercialLinkingWorkflowUseCase } from "@/workflow/orderCommercialLinking/useCase/runOrderCommercialLinkingWorkflow.useCase";
import { EnsureOrderBillingAndDueLinksUseCase } from "./ensureOrderBillingAndDueLinks.useCase";

export const createEnsureOrderBillingAndDueLinksUseCase = (params: {
  runOrderCommercialLinkingWorkflowUseCase: RunOrderCommercialLinkingWorkflowUseCase;
}): EnsureOrderBillingAndDueLinksUseCase => ({
  async execute(orderRemoteId: string) {
    return params.runOrderCommercialLinkingWorkflowUseCase.execute({
      orderRemoteId,
    });
  },
});
