import { BillingOperationResult } from "@/feature/billing/types/billing.types";

export interface ReplaceBillingDocumentAllocationsForSettlementEntryUseCase {
  execute(params: {
    accountRemoteId: string;
    settlementLedgerEntryRemoteId: string;
    settlementTransactionRemoteId: string | null;
    settledAt: number;
    note: string | null;
    allocations: readonly {
      documentRemoteId: string;
      amount: number;
    }[];
  }): Promise<BillingOperationResult>;
}
