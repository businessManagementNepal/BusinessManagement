import { createRunOrderRefundPostingWorkflowUseCase } from "./runOrderRefundPostingWorkflow.useCase.impl";

// Temporary compatibility entrypoint while imports migrate.
export const createRunOrderRefundPostingUseCase =
  createRunOrderRefundPostingWorkflowUseCase;
