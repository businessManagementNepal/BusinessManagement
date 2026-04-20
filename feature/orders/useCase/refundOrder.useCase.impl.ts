import { RunOrderRefundPostingWorkflowUseCase } from "@/workflow/orderRefundPosting/useCase/runOrderRefundPostingWorkflow.useCase";
import { RefundOrderUseCase } from "./refundOrder.useCase";

export const createRefundOrderUseCase = (params: {
  runOrderRefundPostingWorkflowUseCase: RunOrderRefundPostingWorkflowUseCase;
}): RefundOrderUseCase => ({
  async execute(input) {
    const workflowResult =
      await params.runOrderRefundPostingWorkflowUseCase.execute(input);

    if (!workflowResult.success) {
      return {
        success: false,
        error: workflowResult.error,
      };
    }

    return {
      success: true,
      value: true,
    };
  },
});
