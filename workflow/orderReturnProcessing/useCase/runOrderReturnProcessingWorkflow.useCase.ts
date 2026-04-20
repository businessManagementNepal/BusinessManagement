import {
  OrderReturnProcessingWorkflowInput,
  OrderReturnProcessingWorkflowResult,
} from "../types/orderReturnProcessingWorkflow.types";

export interface RunOrderReturnProcessingWorkflowUseCase {
  execute(
    params: OrderReturnProcessingWorkflowInput,
  ): Promise<OrderReturnProcessingWorkflowResult>;
}
