import { OrderOperationResult } from "@/feature/orders/types/order.types";
import { OrderPaymentPostingWorkflowInput } from "../types/orderPaymentPostingWorkflow.types";

export interface RunOrderPaymentPostingWorkflowUseCase {
  execute(
    params: OrderPaymentPostingWorkflowInput,
  ): Promise<OrderOperationResult>;
}
