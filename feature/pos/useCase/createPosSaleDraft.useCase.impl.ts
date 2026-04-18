import { PosSaleWorkflowStatus } from "../types/posSale.constant";
import type {
  CreatePosSaleDraftParams,
  CreatePosSaleDraftRepository,
  CreatePosSaleDraftUseCase,
} from "./createPosSaleDraft.useCase";
import type { PosSaleResult } from "../types/posSale.error.types";

export const createCreatePosSaleDraftUseCase = (
  repository: CreatePosSaleDraftRepository,
): CreatePosSaleDraftUseCase => ({
  async execute(params: CreatePosSaleDraftParams): Promise<PosSaleResult> {
    return repository.createPosSaleRecord({
      ...params,
      workflowStatus: PosSaleWorkflowStatus.PendingValidation,
      billingDocumentRemoteId: null,
      ledgerEntryRemoteId: null,
      postedTransactionRemoteIds: [],
      lastErrorType: null,
      lastErrorMessage: null,
    });
  },
});
