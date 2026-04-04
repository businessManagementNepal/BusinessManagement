import {
  BillPhoto,
  BillingDocument,
  BillingDocumentStatusValue,
  BillingDocumentTypeValue,
  BillingTemplateOption,
  BillingTemplateTypeValue,
} from "@/feature/billing/types/billing.types";

export type BillingTabValue = "invoices" | "receipts" | "billPhotos";

export type BillingLineItemFormState = {
  remoteId: string;
  itemName: string;
  quantity: string;
  unitRate: string;
};

export type BillingDocumentFormState = {
  remoteId: string | null;
  documentType: BillingDocumentTypeValue;
  customerName: string;
  templateType: BillingTemplateTypeValue;
  status: BillingDocumentStatusValue;
  taxRatePercent: string;
  notes: string;
  issuedAt: string;
  items: BillingLineItemFormState[];
};

export interface BillingViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  activeTab: BillingTabValue;
  summary: {
    totalDocuments: number;
    pendingAmount: number;
    overdueAmount: number;
  };
  documents: readonly BillingDocument[];
  billPhotos: readonly BillPhoto[];
  templateOptions: readonly BillingTemplateOption[];
  isTemplateModalVisible: boolean;
  isEditorVisible: boolean;
  editorTitle: string;
  form: BillingDocumentFormState;
  activeTemplateType: BillingTemplateTypeValue;
  currencyCode: string;
  countryCode: string | null;
  canManage: boolean;
  onRefresh: () => Promise<void>;
  onTabChange: (value: BillingTabValue) => void;
  onOpenTemplateModal: () => void;
  onCloseTemplateModal: () => void;
  onSelectTemplate: (value: BillingTemplateTypeValue) => void;
  onOpenCreate: () => void;
  onOpenEdit: (document: BillingDocument) => void;
  onCloseEditor: () => void;
  onFormChange: (field: keyof Omit<BillingDocumentFormState, "items">, value: string) => void;
  onLineItemChange: (remoteId: string, field: keyof BillingLineItemFormState, value: string) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (remoteId: string) => void;
  onSubmit: () => Promise<void>;
  onDelete: (document: BillingDocument) => Promise<void>;
  onPrintPreview: () => void;
  onExportPdf: () => void;
  onUploadBillPhoto: () => Promise<void>;
  draftTotals: {
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
  };
}
