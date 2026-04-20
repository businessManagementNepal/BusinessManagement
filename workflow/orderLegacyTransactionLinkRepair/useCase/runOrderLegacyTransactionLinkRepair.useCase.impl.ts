import { createRunOrderLegacyTransactionLinkRepairWorkflowUseCase } from "./runOrderLegacyTransactionLinkRepairWorkflow.useCase.impl";

// Temporary compatibility entrypoint while imports migrate.
export const createRunOrderLegacyTransactionLinkRepairUseCase =
  createRunOrderLegacyTransactionLinkRepairWorkflowUseCase;
