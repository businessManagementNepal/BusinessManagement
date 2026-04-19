import { BillingOperationResult } from "@/feature/billing/types/billing.types";

export interface LinkBillingDocumentLedgerEntryUseCase {
  execute(
    documentRemoteId: string,
    ledgerEntryRemoteId: string | null,
  ): Promise<BillingOperationResult>;
}
