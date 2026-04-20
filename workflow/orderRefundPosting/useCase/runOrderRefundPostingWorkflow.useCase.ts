import {
    OrderRefundPostingWorkflowInput,
    OrderRefundPostingWorkflowResult,
} from "../types/orderRefundPostingWorkflow.types";

export interface RunOrderRefundPostingWorkflowUseCase {
  execute(
    params: OrderRefundPostingWorkflowInput,
  ): Promise<OrderRefundPostingWorkflowResult>;
}
