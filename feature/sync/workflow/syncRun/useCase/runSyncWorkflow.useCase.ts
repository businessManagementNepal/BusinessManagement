import { RunSyncWorkflowInput, RunSyncWorkflowResult } from "../types/syncRun.types";

export interface RunSyncWorkflowUseCase {
  execute(input: RunSyncWorkflowInput): Promise<RunSyncWorkflowResult>;
}
