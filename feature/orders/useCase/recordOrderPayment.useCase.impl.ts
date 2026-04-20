import { RunOrderPaymentPostingWorkflowUseCase } from "@/workflow/orderPaymentPosting/useCase/runOrderPaymentPostingWorkflow.useCase";
import { RecordOrderPaymentUseCase } from "./recordOrderPayment.useCase";

export const createRecordOrderPaymentUseCase = (params: {
  runOrderPaymentPostingWorkflowUseCase: RunOrderPaymentPostingWorkflowUseCase;
}): RecordOrderPaymentUseCase => ({
  async execute(input) {
    return params.runOrderPaymentPostingWorkflowUseCase.execute(input);
  },
});
