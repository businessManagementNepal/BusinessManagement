import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import * as Crypto from "expo-crypto";
import {
  BILLING_TEMPLATE_OPTIONS,
  BillingDocument,
  BillPhoto,
  BillingDocumentStatus,
  BillingDocumentType,
  BillingTemplateType,
} from "@/feature/billing/types/billing.types";
import { BillingViewModel, BillingDocumentFormState, BillingLineItemFormState, BillingTabValue } from "./billing.viewModel";
import { GetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase";
import { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import { DeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase";
import { SaveBillPhotoUseCase } from "@/feature/billing/useCase/saveBillPhoto.useCase";
import { buildBillingDraftHtml } from "@/feature/billing/ui/printBillingDocument.util";
import { resolveCurrencyCode } from "@/shared/utils/currency/accountCurrency";
import { pickImageFromLibrary } from "@/shared/utils/media/pickImage";

const createEmptyLineItem = (): BillingLineItemFormState => ({
  remoteId: Crypto.randomUUID(),
  itemName: "",
  quantity: "1",
  unitRate: "0",
});

const EMPTY_FORM: BillingDocumentFormState = {
  remoteId: null,
  documentType: BillingDocumentType.Invoice,
  customerName: "",
  templateType: BillingTemplateType.StandardInvoice,
  status: BillingDocumentStatus.Pending,
  taxRatePercent: "13",
  notes: "",
  issuedAt: new Date().toISOString().slice(0, 10),
  items: [createEmptyLineItem()],
};

const parseNumber = (value: string): number => {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildDocumentNumber = ({
  documentType,
  remoteId,
  issuedAt,
}: {
  documentType: BillingDocument["documentType"];
  remoteId: string;
  issuedAt: number;
}): string => {
  const prefix =
    documentType === BillingDocumentType.Receipt ? "RCPT" : "INV";
  const year = new Date(issuedAt).getUTCFullYear();
  const token = remoteId.replace(/-/g, "").slice(-8).toUpperCase();

  return `${prefix}-${year}-${token}`;
};

const formatDateInput = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 10);

const mapDocumentToForm = (document: BillingDocument): BillingDocumentFormState => ({
  remoteId: document.remoteId,
  documentType: document.documentType,
  customerName: document.customerName,
  templateType: document.templateType,
  status: document.status,
  taxRatePercent: String(document.taxRatePercent),
  notes: document.notes ?? "",
  issuedAt: formatDateInput(document.issuedAt),
  items: document.items.length > 0
    ? document.items.map((item) => ({
        remoteId: item.remoteId,
        itemName: item.itemName,
        quantity: String(item.quantity),
        unitRate: String(item.unitRate),
      }))
    : [createEmptyLineItem()],
});

type Params = {
  accountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  canManage: boolean;
  getBillingOverviewUseCase: GetBillingOverviewUseCase;
  saveBillingDocumentUseCase: SaveBillingDocumentUseCase;
  deleteBillingDocumentUseCase: DeleteBillingDocumentUseCase;
  saveBillPhotoUseCase: SaveBillPhotoUseCase;
};

export const useBillingViewModel = ({
  accountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  canManage,
  getBillingOverviewUseCase,
  saveBillingDocumentUseCase,
  deleteBillingDocumentUseCase,
  saveBillPhotoUseCase,
}: Params): BillingViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [billPhotos, setBillPhotos] = useState<BillPhoto[]>([]);
  const [summary, setSummary] = useState({ totalDocuments: 0, pendingAmount: 0, overdueAmount: 0 });
  const [activeTab, setActiveTab] = useState<BillingTabValue>("invoices");
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [form, setForm] = useState<BillingDocumentFormState>(EMPTY_FORM);
  const currencyCode = useMemo(
    () =>
      resolveCurrencyCode({
        currencyCode: activeAccountCurrencyCode,
        countryCode: activeAccountCountryCode,
      }),
    [activeAccountCountryCode, activeAccountCurrencyCode],
  );

  const loadOverview = useCallback(async () => {
    if (!accountRemoteId) {
      setDocuments([]);
      setBillPhotos([]);
      setSummary({ totalDocuments: 0, pendingAmount: 0, overdueAmount: 0 });
      setErrorMessage("A business account is required to manage billing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await getBillingOverviewUseCase.execute(accountRemoteId);
    if (!result.success) {
      setErrorMessage(result.error.message);
      setDocuments([]);
      setBillPhotos([]);
      setSummary({ totalDocuments: 0, pendingAmount: 0, overdueAmount: 0 });
      setIsLoading(false);
      return;
    }
    setDocuments(result.value.documents);
    setBillPhotos(result.value.billPhotos);
    setSummary(result.value.summary);
    setErrorMessage(null);
    setIsLoading(false);
  }, [accountRemoteId, getBillingOverviewUseCase]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const draftTotals = useMemo(() => {
    const subtotalAmount = Number(
      form.items.reduce((sum, item) => sum + parseNumber(item.quantity) * parseNumber(item.unitRate), 0).toFixed(2),
    );
    const taxAmount = Number(((subtotalAmount * parseNumber(form.taxRatePercent)) / 100).toFixed(2));
    const totalAmount = Number((subtotalAmount + taxAmount).toFixed(2));
    return { subtotalAmount, taxAmount, totalAmount };
  }, [form.items, form.taxRatePercent]);

  const filteredDocuments = useMemo(() => {
    if (activeTab === "receipts") {
      return documents.filter((item) => item.documentType === BillingDocumentType.Receipt);
    }
    return documents.filter((item) => item.documentType === BillingDocumentType.Invoice);
  }, [activeTab, documents]);

  const editorTitle = useMemo(() => {
    const prefix = form.documentType === BillingDocumentType.Invoice ? "Invoice" : "Receipt";
    return form.remoteId ? `Edit ${prefix}` : `Create ${prefix}`;
  }, [form.documentType, form.remoteId]);

  const activeTemplateType = form.templateType;

  const onOpenCreate = useCallback(() => {
    const nextDocumentType = activeTab === "receipts" ? BillingDocumentType.Receipt : BillingDocumentType.Invoice;
    setForm({
      ...EMPTY_FORM,
      documentType: nextDocumentType,
      templateType: nextDocumentType === BillingDocumentType.Receipt ? BillingTemplateType.PosReceipt : BillingTemplateType.StandardInvoice,
      items: [createEmptyLineItem()],
      issuedAt: new Date().toISOString().slice(0, 10),
    });
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, [activeTab]);

  const onOpenEdit = useCallback((document: BillingDocument) => {
    setForm(mapDocumentToForm(document));
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, []);

  const onCloseEditor = useCallback(() => {
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
  }, []);

  const onFormChange = useCallback((field: keyof Omit<BillingDocumentFormState, "items">, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const onLineItemChange = useCallback((remoteId: string, field: keyof BillingLineItemFormState, value: string) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) => item.remoteId === remoteId ? { ...item, [field]: value } : item),
    }));
  }, []);

  const onAddLineItem = useCallback(() => {
    setForm((current) => ({ ...current, items: [...current.items, createEmptyLineItem()] }));
  }, []);

  const onRemoveLineItem = useCallback((remoteId: string) => {
    setForm((current) => ({
      ...current,
      items: current.items.length > 1 ? current.items.filter((item) => item.remoteId !== remoteId) : current.items,
    }));
  }, []);

  const onSubmit = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage billing.");
      return;
    }
    if (!accountRemoteId) {
      setErrorMessage("A business account is required to manage billing.");
      return;
    }
    const normalizedItems = form.items
      .map((item, index) => ({
        remoteId: item.remoteId || Crypto.randomUUID(),
        itemName: item.itemName.trim(),
        quantity: parseNumber(item.quantity),
        unitRate: parseNumber(item.unitRate),
        lineOrder: index,
      }))
      .filter((item) => item.itemName.length > 0);

    if (!form.customerName.trim()) {
      setErrorMessage("Customer name is required.");
      return;
    }
    if (normalizedItems.length === 0) {
      setErrorMessage("Add at least one item.");
      return;
    }
    if (normalizedItems.some((item) => item.quantity <= 0)) {
      setErrorMessage("Item quantity must be greater than zero.");
      return;
    }

    const issuedAt = new Date(form.issuedAt || new Date().toISOString()).getTime();
    const normalizedIssuedAt = Number.isFinite(issuedAt) ? issuedAt : Date.now();
    const resolvedRemoteId = form.remoteId ?? Crypto.randomUUID();
    const existingDocumentNumber = form.remoteId
      ? documents.find((item) => item.remoteId === form.remoteId)?.documentNumber
      : null;
    const result = await saveBillingDocumentUseCase.execute({
      remoteId: resolvedRemoteId,
      accountRemoteId,
      documentNumber:
        existingDocumentNumber ??
        buildDocumentNumber({
          documentType: form.documentType,
          remoteId: resolvedRemoteId,
          issuedAt: normalizedIssuedAt,
        }),
      documentType: form.documentType,
      templateType: form.templateType,
      customerName: form.customerName,
      status: form.status,
      taxRatePercent: parseNumber(form.taxRatePercent),
      notes: form.notes || null,
      issuedAt: normalizedIssuedAt,
      items: normalizedItems,
    });
    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
    await loadOverview();
  }, [accountRemoteId, canManage, documents, form, loadOverview, saveBillingDocumentUseCase]);

  const onDelete = useCallback(async (document: BillingDocument) => {
    const result = await deleteBillingDocumentUseCase.execute(document.remoteId);
    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }
    await loadOverview();
  }, [deleteBillingDocumentUseCase, loadOverview]);

  const openPrintableWindow = useCallback(() => {
    if (Platform.OS !== "web") {
      Alert.alert("Print", "Print preview is available on web in this build.");
      return;
    }
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) {
      setErrorMessage("Unable to open print preview. Please allow popups.");
      return;
    }
    const html = buildBillingDraftHtml(
      form,
      draftTotals.subtotalAmount,
      draftTotals.taxAmount,
      draftTotals.totalAmount,
      currencyCode,
      activeAccountCountryCode,
    );
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => {
      popup.print();
    }, 250);
  }, [
    activeAccountCountryCode,
    currencyCode,
    draftTotals.subtotalAmount,
    draftTotals.taxAmount,
    draftTotals.totalAmount,
    form,
  ]);

  const onPrintPreview = useCallback(() => {
    openPrintableWindow();
  }, [openPrintableWindow]);

  const onExportPdf = useCallback(() => {
    openPrintableWindow();
  }, [openPrintableWindow]);

  const onUploadBillPhoto = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to upload bill photos.");
      return;
    }
    if (!accountRemoteId) {
      setErrorMessage("A business account is required to manage billing.");
      return;
    }

    const savePhoto = async ({
      fileName,
      mimeType,
      imageDataUrl,
    }: {
      fileName: string;
      mimeType: string | null;
      imageDataUrl: string;
    }): Promise<void> => {
      const saveResult = await saveBillPhotoUseCase.execute({
        remoteId: Crypto.randomUUID(),
        accountRemoteId,
        documentRemoteId: null,
        fileName,
        mimeType,
        imageDataUrl,
        uploadedAt: Date.now(),
      });
      if (!saveResult.success) {
        setErrorMessage(saveResult.error.message);
        return;
      }
      await loadOverview();
    };

    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const result = reader.result;
          if (typeof result !== "string") {
            setErrorMessage("Unable to read the selected image.");
            return;
          }
          await savePhoto({
            fileName: file.name,
            mimeType: file.type || null,
            imageDataUrl: result,
          });
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    const pickedImage = await pickImageFromLibrary();
    if (!pickedImage) {
      return;
    }

    const imageDataUrl = pickedImage.dataUrl;
    if (!imageDataUrl) {
      setErrorMessage("Unable to read the selected image.");
      return;
    }

    await savePhoto({
      fileName: pickedImage.fileName,
      mimeType: pickedImage.mimeType,
      imageDataUrl,
    });
  }, [accountRemoteId, canManage, loadOverview, saveBillPhotoUseCase]);

  return useMemo(() => ({
    isLoading,
    errorMessage,
    activeTab,
    summary,
    documents: filteredDocuments,
    billPhotos,
    templateOptions: BILLING_TEMPLATE_OPTIONS,
    isTemplateModalVisible,
    isEditorVisible,
    editorTitle,
    form,
    activeTemplateType,
    currencyCode,
    countryCode: activeAccountCountryCode,
    canManage,
    onRefresh: loadOverview,
    onTabChange: setActiveTab,
    onOpenTemplateModal: () => setIsTemplateModalVisible(true),
    onCloseTemplateModal: () => setIsTemplateModalVisible(false),
    onSelectTemplate: (value) => {
      setForm((current) => ({ ...current, templateType: value }));
      setIsTemplateModalVisible(false);
    },
    onOpenCreate,
    onOpenEdit,
    onCloseEditor,
    onFormChange,
    onLineItemChange,
    onAddLineItem,
    onRemoveLineItem,
    onSubmit,
    onDelete,
    onPrintPreview,
    onExportPdf,
    onUploadBillPhoto,
    draftTotals,
  }), [activeTab, activeTemplateType, activeAccountCountryCode, billPhotos, canManage, currencyCode, draftTotals, editorTitle, errorMessage, filteredDocuments, form, isEditorVisible, isLoading, isTemplateModalVisible, loadOverview, onAddLineItem, onCloseEditor, onDelete, onExportPdf, onFormChange, onLineItemChange, onOpenCreate, onOpenEdit, onPrintPreview, onRemoveLineItem, onSubmit, onUploadBillPhoto, summary]);
};
