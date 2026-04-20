import { RunOrderRefundPostingWorkflowUseCase } from "@/workflow/orderRefundPosting/useCase/runOrderRefundPostingWorkflow.useCase";
import { RefundOrderUseCase } from "./refundOrder.useCase";

export const createRefundOrderUseCase = (params: {
  runOrderRefundPostingWorkflowUseCase: RunOrderRefundPostingWorkflowUseCase;
}): RefundOrderUseCase => ({
  async execute(input) {
    return params.runOrderRefundPostingWorkflowUseCase.execute(input);
  },
});
