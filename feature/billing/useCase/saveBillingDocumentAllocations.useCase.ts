import {
  BillingOperationResult,
  SaveBillingDocumentAllocationPayload,
} from "@/feature/billing/types/billing.types";

export interface SaveBillingDocumentAllocationsUseCase {
  execute(
    payloads: readonly SaveBillingDocumentAllocationPayload[],
  ): Promise<BillingOperationResult>;
}
