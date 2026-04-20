import { EnsureOrderBillingAndDueLinksResult } from "@/feature/orders/useCase/ensureOrderBillingAndDueLinks.useCase";
import { OrderCommercialLinkingWorkflowInput } from "../types/orderCommercialLinkingWorkflow.types";

export interface RunOrderCommercialLinkingWorkflowUseCase {
  execute(
    params: OrderCommercialLinkingWorkflowInput,
  ): Promise<EnsureOrderBillingAndDueLinksResult>;
}
