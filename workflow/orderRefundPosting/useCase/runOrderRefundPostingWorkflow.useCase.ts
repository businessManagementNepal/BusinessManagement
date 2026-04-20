import { OrderOperationResult } from "@/feature/orders/types/order.types";
import { OrderRefundPostingWorkflowInput } from "../types/orderRefundPostingWorkflow.types";

export interface RunOrderRefundPostingWorkflowUseCase {
  execute(
    params: OrderRefundPostingWorkflowInput,
  ): Promise<OrderOperationResult>;
}
