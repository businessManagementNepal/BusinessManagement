import { BillingOperationResult } from "@/feature/billing/types/billing.types";

export interface DeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase {
  execute(settlementLedgerEntryRemoteId: string): Promise<BillingOperationResult>;
}
