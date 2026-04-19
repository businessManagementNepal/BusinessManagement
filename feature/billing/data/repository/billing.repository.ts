import {
  BillingDocumentResult,
  BillingOperationResult,
  BillingOverviewResult,
  SaveBillingDocumentAllocationPayload,
  SaveBillPhotoPayload,
  SaveBillingDocumentPayload,
} from "@/feature/billing/types/billing.types";

export interface BillingRepository {
  getBillingOverviewByAccountRemoteId(accountRemoteId: string): Promise<BillingOverviewResult>;
  getBillingDocumentByRemoteId(remoteId: string): Promise<BillingDocumentResult>;
  saveBillingDocument(payload: SaveBillingDocumentPayload): Promise<BillingDocumentResult>;
  deleteBillingDocumentByRemoteId(remoteId: string): Promise<BillingOperationResult>;
  linkBillingDocumentContactRemoteId(
    documentRemoteId: string,
    contactRemoteId: string | null,
  ): Promise<BillingOperationResult>;
  linkBillingDocumentLedgerEntryRemoteId(
    documentRemoteId: string,
    ledgerEntryRemoteId: string | null,
  ): Promise<BillingOperationResult>;
  saveBillPhoto(payload: SaveBillPhotoPayload): Promise<BillingOperationResult>;
  saveBillingDocumentAllocations(
    payloads: readonly SaveBillingDocumentAllocationPayload[],
  ): Promise<BillingOperationResult>;
  replaceBillingDocumentAllocationsForSettlementEntry(params: {
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
  deleteBillingDocumentAllocationsBySettlementEntryRemoteId(
    settlementLedgerEntryRemoteId: string,
  ): Promise<BillingOperationResult>;
}
