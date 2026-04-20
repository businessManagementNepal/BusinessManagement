import { OrderUnknownError, OrderValidationError } from "@/feature/orders/types/order.types";
import { RunOrderPaymentPostingWorkflowUseCase } from "@/workflow/orderPaymentPosting/useCase/runOrderPaymentPostingWorkflow.useCase";
import { RecordOrderPaymentUseCase } from "./recordOrderPayment.useCase";

export const createRecordOrderPaymentUseCase = (params: {
  runOrderPaymentPostingWorkflowUseCase: RunOrderPaymentPostingWorkflowUseCase;
}): RecordOrderPaymentUseCase => ({
  async execute(input) {
    const workflowResult = await params.runOrderPaymentPostingWorkflowUseCase.execute(input);
    
    if (!workflowResult.success) {
      // Map workflow errors to OrderError types
      switch (workflowResult.error.type) {
        case "VALIDATION_ERROR":
          return { success: false, error: OrderValidationError(workflowResult.error.message) };
        case "BUSINESS_RULE_ERROR":
          return { success: false, error: OrderValidationError(workflowResult.error.message) };
        case "SETTLEMENT_ERROR":
          return { success: false, error: OrderValidationError(workflowResult.error.message) };
        case "UNKNOWN_ERROR":
          return { success: false, error: OrderUnknownError };
        default:
          return { success: false, error: OrderUnknownError };
      }
    }
    
    return { success: true, value: true };
  },
});
