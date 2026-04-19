import { Result } from "@/shared/types/result.types";
import { BillingDocumentModel } from "./db/billingDocument.model";
import { BillingDocumentItemModel } from "./db/billingDocumentItem.model";
import { BillPhotoModel } from "./db/billPhoto.model";
import {
  SaveBillingDocumentAllocationPayload,
  SaveBillPhotoPayload,
  SaveBillingDocumentPayload,
} from "@/feature/billing/types/billing.types";

export type BillingDocumentRecord = {
  document: BillingDocumentModel;
  items: BillingDocumentItemModel[];
};

export type BillingDocumentAllocationRecord = {
  remoteId: string;
  accountRemoteId: string;
  documentRemoteId: string;
  settlementLedgerEntryRemoteId: string | null;
  settlementTransactionRemoteId: string | null;
  amount: number;
  settledAt: number;
  note: string | null;
  createdAt: number;
  updatedAt: number;
};

export interface BillingDatasource {
  saveBillingDocument(
    payload: SaveBillingDocumentPayload,
  ): Promise<Result<BillingDocumentRecord>>;
  getBillingDocumentsByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<BillingDocumentRecord[]>>;
  getBillingDocumentByRemoteId(
    remoteId: string,
  ): Promise<Result<BillingDocumentRecord | null>>;
  deleteBillingDocumentByRemoteId(remoteId: string): Promise<Result<boolean>>;
  linkBillingDocumentContactRemoteId(
    documentRemoteId: string,
    contactRemoteId: string | null,
  ): Promise<Result<boolean>>;
  linkBillingDocumentLedgerEntryRemoteId(
    documentRemoteId: string,
    ledgerEntryRemoteId: string | null,
  ): Promise<Result<boolean>>;
  saveBillPhoto(payload: SaveBillPhotoPayload): Promise<Result<BillPhotoModel>>;
  getBillPhotosByAccountRemoteId(accountRemoteId: string): Promise<Result<BillPhotoModel[]>>;
  saveBillingDocumentAllocations(
    payloads: readonly SaveBillingDocumentAllocationPayload[],
  ): Promise<Result<boolean>>;
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
  }): Promise<Result<boolean>>;
  deleteBillingDocumentAllocationsBySettlementEntryRemoteId(
    settlementLedgerEntryRemoteId: string,
  ): Promise<Result<boolean>>;
  getBillingDocumentAllocationsByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<BillingDocumentAllocationRecord[]>>;
}
