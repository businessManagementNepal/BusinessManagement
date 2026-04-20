import { RunOrderReturnProcessingWorkflowUseCase } from "@/workflow/orderReturnProcessing/useCase/runOrderReturnProcessingWorkflow.useCase";
import { ReturnOrderUseCase } from "./returnOrder.useCase";

export const createReturnOrderUseCase = (params: {
  runOrderReturnProcessingWorkflowUseCase: RunOrderReturnProcessingWorkflowUseCase;
}): ReturnOrderUseCase => ({
  async execute(remoteId: string) {
    return params.runOrderReturnProcessingWorkflowUseCase.execute({
      orderRemoteId: remoteId,
    });
  },
});
