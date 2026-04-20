import { Result } from "@/shared/types/result.types";

export const BillingDocumentType = {
  Invoice: "invoice",
  Receipt: "receipt",
  CreditNote: "credit_note",
} as const;
export type BillingDocumentTypeValue =
  (typeof BillingDocumentType)[keyof typeof BillingDocumentType];

export const BillingTemplateType = {
  StandardInvoice: "standard_invoice",
  DetailedInvoice: "detailed_invoice",
  PosReceipt: "pos_receipt",
} as const;
export type BillingTemplateTypeValue =
  (typeof BillingTemplateType)[keyof typeof BillingTemplateType];

export const BillingDocumentStatus = {
  Draft: "draft",
  Paid: "paid",
  PartiallyPaid: "partially_paid",
  Pending: "pending",
  Overdue: "overdue",
} as const;
export type BillingDocumentStatusValue =
  (typeof BillingDocumentStatus)[keyof typeof BillingDocumentStatus];

export type BillingLineItem = {
  remoteId: string;
  itemName: string;
  quantity: number;
  unitRate: number;
  lineTotal: number;
  lineOrder: number;
};

export type BillingDocument = {
  remoteId: string;
  accountRemoteId: string;
  documentNumber: string;
  documentType: BillingDocumentTypeValue;
  templateType: BillingTemplateTypeValue;
  customerName: string;
  contactRemoteId: string | null;
  status: BillingDocumentStatusValue;
  taxRatePercent: number;
  notes: string | null;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  isOverdue: boolean;
  issuedAt: number;
  dueAt: number | null;
  sourceModule: string | null;
  sourceRemoteId: string | null;
  linkedLedgerEntryRemoteId: string | null;
  items: BillingLineItem[];
  createdAt: number;
  updatedAt: number;
};

export type BillingDocumentAllocation = {
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

export type BillPhoto = {
  remoteId: string;
  accountRemoteId: string;
  documentRemoteId: string | null;
  fileName: string;
  mimeType: string | null;
  imageDataUrl: string;
  uploadedAt: number;
  createdAt: number;
  updatedAt: number;
};

export type SaveBillingLineItemPayload = {
  remoteId: string;
  itemName: string;
  quantity: number;
  unitRate: number;
  lineOrder: number;
};

export type SaveBillingDocumentPayload = {
  remoteId: string;
  accountRemoteId: string;
  documentNumber: string;
  documentType: BillingDocumentTypeValue;
  templateType: BillingTemplateTypeValue;
  customerName: string;
  contactRemoteId?: string | null;
  status: BillingDocumentStatusValue;
  taxRatePercent: number;
  notes: string | null;
  issuedAt: number;
  dueAt?: number | null;
  sourceModule?: string | null;
  sourceRemoteId?: string | null;
  linkedLedgerEntryRemoteId?: string | null;
  items: SaveBillingLineItemPayload[];
};

export type SaveBillingDocumentAllocationPayload = {
  remoteId: string;
  accountRemoteId: string;
  documentRemoteId: string;
  settlementLedgerEntryRemoteId?: string | null;
  settlementTransactionRemoteId?: string | null;
  amount: number;
  settledAt: number;
  note?: string | null;
};

export type PayBillingDocumentPayload = {
  billingDocumentRemoteId: string;
  accountRemoteId: string;
  accountDisplayNameSnapshot: string;
  ownerUserRemoteId: string;
  settlementMoneyAccountRemoteId: string;
  settlementMoneyAccountDisplayNameSnapshot: string;
  amount: number;
  settledAt: number;
  note: string | null;
  documentType: BillingDocumentTypeValue;
  documentNumber: string;
};

export type SaveBillPhotoPayload = {
  remoteId: string;
  accountRemoteId: string;
  documentRemoteId: string | null;
  fileName: string;
  mimeType: string | null;
  imageDataUrl: string;
  uploadedAt: number;
};

export type BillingSummary = {
  totalDocuments: number;
  pendingAmount: number;
  overdueAmount: number;
};

export type BillingOverview = {
  documents: BillingDocument[];
  allocations: BillingDocumentAllocation[];
  billPhotos: BillPhoto[];
  summary: BillingSummary;
};

export type BillingTemplateOption = {
  value: BillingTemplateTypeValue;
  label: string;
  description: string;
};

export const BILLING_TEMPLATE_OPTIONS: readonly BillingTemplateOption[] = [
  {
    value: BillingTemplateType.StandardInvoice,
    label: "Standard Invoice",
    description: "Clean professional layout",
  },
  {
    value: BillingTemplateType.DetailedInvoice,
    label: "Detailed Invoice",
    description: "With item descriptions and notes",
  },
  {
    value: BillingTemplateType.PosReceipt,
    label: "POS Receipt",
    description: "Compact thermal receipt format",
  },
] as const;

export const BILLING_STATUS_OPTIONS = [
  { label: "Draft", value: BillingDocumentStatus.Draft },
  { label: "Paid", value: BillingDocumentStatus.Paid },
  { label: "Partially Paid", value: BillingDocumentStatus.PartiallyPaid },
  { label: "Pending", value: BillingDocumentStatus.Pending },
  { label: "Overdue", value: BillingDocumentStatus.Overdue },
] as const;

export const BillingErrorType = {
  DatabaseError: "DATABASE_ERROR",
  ValidationError: "VALIDATION_ERROR",
  DocumentNotFound: "DOCUMENT_NOT_FOUND",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type BillingError = {
  type: (typeof BillingErrorType)[keyof typeof BillingErrorType];
  message: string;
};

export const BillingDatabaseError: BillingError = {
  type: BillingErrorType.DatabaseError,
  message: "Unable to process billing right now. Please try again.",
};
export const BillingValidationError = (message: string): BillingError => ({
  type: BillingErrorType.ValidationError,
  message,
});
export const BillingDocumentNotFoundError: BillingError = {
  type: BillingErrorType.DocumentNotFound,
  message: "The requested billing document was not found.",
};
export const BillingUnknownError: BillingError = {
  type: BillingErrorType.UnknownError,
  message: "An unexpected billing error occurred.",
};

export type BillingOverviewResult = Result<BillingOverview, BillingError>;
export type BillingDocumentResult = Result<BillingDocument, BillingError>;
export type BillPhotoResult = Result<BillPhoto, BillingError>;
export type BillingOperationResult = Result<boolean, BillingError>;
