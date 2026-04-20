import {
    OrderPaymentPostingWorkflowInput,
    OrderPaymentPostingWorkflowResult
} from "../types/orderPaymentPostingWorkflow.types";

export interface RunOrderPaymentPostingWorkflowUseCase {
  execute(
    params: OrderPaymentPostingWorkflowInput,
  ): Promise<OrderPaymentPostingWorkflowResult>;
}
