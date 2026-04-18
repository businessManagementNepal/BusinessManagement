import { BillingDocumentModel } from "@/feature/billing/data/dataSource/db/billingDocument.model";
import { BillingDocumentItemModel } from "@/feature/billing/data/dataSource/db/billingDocumentItem.model";
import { BillPhotoModel } from "@/feature/billing/data/dataSource/db/billPhoto.model";
import {
    BillPhoto,
    BillingDocument,
    BillingDocumentAllocation,
    BillingLineItem,
} from "@/feature/billing/types/billing.types";

export const mapBillingItemModelToDomain = (
  model: BillingDocumentItemModel,
): BillingLineItem => ({
  remoteId: model.remoteId,
  itemName: model.itemName,
  quantity: model.quantity,
  unitRate: model.unitRate,
  lineTotal: model.lineTotal,
  lineOrder: model.lineOrder,
});

export const mapBillingDocumentModelToDomain = (
  document: BillingDocumentModel,
  items: BillingDocumentItemModel[],
): BillingDocument => ({
  remoteId: document.remoteId,
  accountRemoteId: document.accountRemoteId,
  documentNumber: document.documentNumber,
  documentType: document.documentType,
  templateType: document.templateType,
  customerName: document.customerName,
  contactRemoteId: document.contactRemoteId,
  status: document.status,
  taxRatePercent: document.taxRatePercent,
  notes: document.notes,
  subtotalAmount: document.subtotalAmount,
  taxAmount: document.taxAmount,
  totalAmount: document.totalAmount,
  paidAmount: 0,
  outstandingAmount: document.totalAmount,
  isOverdue: false,
  issuedAt: document.issuedAt,
  dueAt: document.dueAt,
  sourceModule: document.sourceModule,
  sourceRemoteId: document.sourceRemoteId,
  linkedLedgerEntryRemoteId: document.linkedLedgerEntryRemoteId,
  items: items.map(mapBillingItemModelToDomain),
  createdAt: document.createdAt.getTime(),
  updatedAt: document.updatedAt.getTime(),
});

export const mapBillingAllocationRecordToDomain = (record: {
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
}): BillingDocumentAllocation => ({
  remoteId: record.remoteId,
  accountRemoteId: record.accountRemoteId,
  documentRemoteId: record.documentRemoteId,
  settlementLedgerEntryRemoteId: record.settlementLedgerEntryRemoteId,
  settlementTransactionRemoteId: record.settlementTransactionRemoteId,
  amount: record.amount,
  settledAt: record.settledAt,
  note: record.note,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

export const mapBillPhotoModelToDomain = (model: BillPhotoModel): BillPhoto => ({
  remoteId: model.remoteId,
  accountRemoteId: model.accountRemoteId,
  documentRemoteId: model.documentRemoteId,
  fileName: model.fileName,
  mimeType: model.mimeType,
  imageDataUrl: model.imageDataUrl,
  uploadedAt: model.uploadedAt,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});
