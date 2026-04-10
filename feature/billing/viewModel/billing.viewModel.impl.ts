import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
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
import { SaveBillingDocumentAllocationsUseCase } from "@/feature/billing/useCase/saveBillingDocumentAllocations.useCase";
import { buildBillingDraftHtml } from "@/feature/billing/ui/printBillingDocument.util";
import { pickImageFromLibrary } from "@/shared/utils/media/pickImage";
import { exportDocument } from "@/shared/utils/document/exportDocument";
import {
  resolveRegionalFinancePolicy,
} from "@/shared/utils/finance/regionalFinancePolicy";
import { TaxModeValue } from "@/shared/types/regionalFinance.types";
import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import { MoneyAccount, MoneyAccountType } from "@/feature/accounts/types/moneyAccount.types";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import {
  SaveTransactionPayload,
  TransactionDirection,
  TransactionSourceModule,
  TransactionType,
} from "@/feature/transactions/types/transaction.entity.types";

const createEmptyLineItem = (): BillingLineItemFormState => ({
  remoteId: Crypto.randomUUID(),
  itemName: "",
  quantity: "1",
  unitRate: "0",
});

const createEmptyForm = (defaultTaxRatePercent: string): BillingDocumentFormState => ({
  remoteId: null,
  documentType: BillingDocumentType.Invoice,
  customerName: "",
  templateType: BillingTemplateType.StandardInvoice,
  status: BillingDocumentStatus.Pending,
  taxRatePercent: defaultTaxRatePercent,
  notes: "",
  issuedAt: new Date().toISOString().slice(0, 10),
  dueAt: "",
  paidNowAmount: "0",
  settlementAccountRemoteId: "",
  items: [createEmptyLineItem()],
});

const createTransactionRemoteId = (): string => {
  return `txn-billing-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createAllocationRemoteId = (): string => {
  return `alloc-billing-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const parseNumber = (value: string): number => {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapMoneyAccountToOption = (moneyAccount: MoneyAccount): {
  remoteId: string;
  label: string;
} => {
  const accountTypeLabel =
    moneyAccount.type === MoneyAccountType.Cash
      ? "Cash"
      : moneyAccount.type === MoneyAccountType.Bank
        ? "Bank"
        : "Wallet";

  return {
    remoteId: moneyAccount.remoteId,
    label: `${moneyAccount.name} (${accountTypeLabel})`,
  };
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

const formatDateInput = (timestamp: number | null): string => {
  if (timestamp === null) {
    return "";
  }
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) {
    return "";
  }
  return value.toISOString().slice(0, 10);
};

const mapDocumentToForm = (document: BillingDocument): BillingDocumentFormState => ({
  remoteId: document.remoteId,
  documentType: document.documentType,
  customerName: document.customerName,
  templateType: document.templateType,
  status: document.status,
  taxRatePercent: String(document.taxRatePercent),
  notes: document.notes ?? "",
  issuedAt: formatDateInput(document.issuedAt),
  dueAt: formatDateInput(document.dueAt),
  paidNowAmount: "0",
  settlementAccountRemoteId: "",
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
  ownerUserRemoteId: string | null;
  accountRemoteId: string | null;
  accountDisplayNameSnapshot: string;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  activeAccountDefaultTaxRatePercent: number | null;
  activeAccountDefaultTaxMode: TaxModeValue | null;
  canManage: boolean;
  getBillingOverviewUseCase: GetBillingOverviewUseCase;
  saveBillingDocumentUseCase: SaveBillingDocumentUseCase;
  saveBillingDocumentAllocationsUseCase: SaveBillingDocumentAllocationsUseCase;
  deleteBillingDocumentUseCase: DeleteBillingDocumentUseCase;
  saveBillPhotoUseCase: SaveBillPhotoUseCase;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  postBusinessTransactionUseCase: PostBusinessTransactionUseCase;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
};

export const useBillingViewModel = ({
  ownerUserRemoteId,
  accountRemoteId,
  accountDisplayNameSnapshot,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  activeAccountDefaultTaxRatePercent,
  activeAccountDefaultTaxMode,
  canManage,
  getBillingOverviewUseCase,
  saveBillingDocumentUseCase,
  saveBillingDocumentAllocationsUseCase,
  deleteBillingDocumentUseCase,
  saveBillPhotoUseCase,
  getMoneyAccountsUseCase,
  postBusinessTransactionUseCase,
  deleteBusinessTransactionUseCase,
}: Params): BillingViewModel => {
  const regionalFinancePolicy = useMemo(
    () =>
      resolveRegionalFinancePolicy({
        countryCode: activeAccountCountryCode,
        currencyCode: activeAccountCurrencyCode,
        defaultTaxRatePercent: activeAccountDefaultTaxRatePercent,
        defaultTaxMode: activeAccountDefaultTaxMode,
      }),
    [
      activeAccountCountryCode,
      activeAccountCurrencyCode,
      activeAccountDefaultTaxMode,
      activeAccountDefaultTaxRatePercent,
    ],
  );
  const defaultTaxRatePercent = useMemo(
    () => String(regionalFinancePolicy.defaultTaxRatePercent),
    [regionalFinancePolicy.defaultTaxRatePercent],
  );
  const taxRateOptions = useMemo(
    () =>
      regionalFinancePolicy.taxRateOptions.map((ratePercent) =>
        String(ratePercent),
      ),
    [regionalFinancePolicy.taxRateOptions],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [billPhotos, setBillPhotos] = useState<BillPhoto[]>([]);
  const [summary, setSummary] = useState({ totalDocuments: 0, pendingAmount: 0, overdueAmount: 0 });
  const [activeTab, setActiveTab] = useState<BillingTabValue>("invoices");
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [availableSettlementAccounts, setAvailableSettlementAccounts] = useState<
    readonly { remoteId: string; label: string }[]
  >([]);
  const [form, setForm] = useState<BillingDocumentFormState>(
    createEmptyForm(defaultTaxRatePercent),
  );
  const currencyCode = regionalFinancePolicy.currencyCode;

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

  useEffect(() => {
    if (!isEditorVisible) {
      setForm(createEmptyForm(defaultTaxRatePercent));
    }
  }, [defaultTaxRatePercent, isEditorVisible]);

  const loadSettlementAccounts = useCallback(async () => {
    if (!accountRemoteId) {
      setAvailableSettlementAccounts([]);
      return;
    }

    const result = await getMoneyAccountsUseCase.execute(accountRemoteId);
    if (!result.success) {
      setAvailableSettlementAccounts([]);
      return;
    }

    const options = result.value
      .filter((moneyAccount) => moneyAccount.isActive)
      .sort((left, right) => {
        if (left.isPrimary && !right.isPrimary) return -1;
        if (!left.isPrimary && right.isPrimary) return 1;
        return left.name.localeCompare(right.name);
      })
      .map(mapMoneyAccountToOption);

    setAvailableSettlementAccounts(options);
    setForm((currentForm) => {
      if (currentForm.settlementAccountRemoteId.trim().length > 0) {
        return currentForm;
      }
      return {
        ...currentForm,
        settlementAccountRemoteId: options[0]?.remoteId ?? "",
      };
    });
  }, [accountRemoteId, getMoneyAccountsUseCase]);

  useEffect(() => {
    void loadSettlementAccounts();
  }, [loadSettlementAccounts]);

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
    const baseForm = createEmptyForm(defaultTaxRatePercent);
    setForm({
      ...baseForm,
      documentType: nextDocumentType,
      templateType: nextDocumentType === BillingDocumentType.Receipt ? BillingTemplateType.PosReceipt : BillingTemplateType.StandardInvoice,
      items: [createEmptyLineItem()],
      issuedAt: new Date().toISOString().slice(0, 10),
      dueAt: "",
      paidNowAmount: "0",
      settlementAccountRemoteId: availableSettlementAccounts[0]?.remoteId ?? "",
    });
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, [activeTab, availableSettlementAccounts, defaultTaxRatePercent]);

  const onOpenEdit = useCallback((document: BillingDocument) => {
    setForm({
      ...mapDocumentToForm(document),
      settlementAccountRemoteId: availableSettlementAccounts[0]?.remoteId ?? "",
    });
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, [availableSettlementAccounts]);

  const onCloseEditor = useCallback(() => {
    setIsEditorVisible(false);
    setForm(createEmptyForm(defaultTaxRatePercent));
  }, [defaultTaxRatePercent]);

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

    const paidNowAmount = Number(parseNumber(form.paidNowAmount).toFixed(2));
    if (paidNowAmount < 0) {
      setErrorMessage("Paid amount cannot be negative.");
      return;
    }
    if (paidNowAmount > draftTotals.totalAmount + 0.0001) {
      setErrorMessage("Paid amount cannot be greater than total amount.");
      return;
    }
    if (paidNowAmount > 0 && form.settlementAccountRemoteId.trim().length === 0) {
      setErrorMessage("Money account is required when paid amount is entered.");
      return;
    }

    const pendingAfterPayment = Number(
      Math.max(draftTotals.totalAmount - paidNowAmount, 0).toFixed(2),
    );

    const issuedAt = new Date(form.issuedAt || new Date().toISOString()).getTime();
    const normalizedIssuedAt = Number.isFinite(issuedAt) ? issuedAt : Date.now();
    const dueAt = form.dueAt.trim().length > 0
      ? new Date(form.dueAt).getTime()
      : null;
    if (form.dueAt.trim().length > 0 && (!Number.isFinite(dueAt) || dueAt === null)) {
      setErrorMessage("Enter a valid due date in YYYY-MM-DD format.");
      return;
    }
    if (pendingAfterPayment > 0 && dueAt === null) {
      setErrorMessage("Due date is required when pending amount exists.");
      return;
    }
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
      status:
        form.status === BillingDocumentStatus.Draft
          ? BillingDocumentStatus.Draft
          : BillingDocumentStatus.Pending,
      taxRatePercent: parseNumber(form.taxRatePercent),
      notes: form.notes || null,
      issuedAt: normalizedIssuedAt,
      dueAt: pendingAfterPayment > 0 ? dueAt : null,
      items: normalizedItems,
    });
    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    if (paidNowAmount > 0) {
      if (!ownerUserRemoteId?.trim()) {
        setErrorMessage(
          "Bill saved, but payment could not be posted because user context is missing.",
        );
        await loadOverview();
        return;
      }

      const selectedSettlementAccount = availableSettlementAccounts.find(
        (account) => account.remoteId === form.settlementAccountRemoteId.trim(),
      );
      if (!selectedSettlementAccount) {
        setErrorMessage("Bill saved, but selected money account is not available.");
        await loadOverview();
        return;
      }

      const isSaleDocument = form.documentType === BillingDocumentType.Invoice;
      const transactionRemoteId = createTransactionRemoteId();
      const transactionPayload: SaveTransactionPayload = {
        remoteId: transactionRemoteId,
        ownerUserRemoteId: ownerUserRemoteId.trim(),
        accountRemoteId,
        accountDisplayNameSnapshot: accountDisplayNameSnapshot || "Business Account",
        transactionType: isSaleDocument
          ? TransactionType.Income
          : TransactionType.Expense,
        direction: isSaleDocument
          ? TransactionDirection.In
          : TransactionDirection.Out,
        title: isSaleDocument
          ? `Received for ${result.value.documentNumber}`
          : `Paid for ${result.value.documentNumber}`,
        amount: paidNowAmount,
        currencyCode,
        categoryLabel: "Billing",
        note: form.notes.trim() || null,
        happenedAt: normalizedIssuedAt,
        settlementMoneyAccountRemoteId: selectedSettlementAccount.remoteId,
        settlementMoneyAccountDisplayNameSnapshot: selectedSettlementAccount.label,
        sourceModule: TransactionSourceModule.Billing,
        sourceRemoteId: result.value.remoteId,
        sourceAction: "document_payment",
        idempotencyKey: `billing:${result.value.remoteId}:payment:${transactionRemoteId}`,
      };

      const transactionResult =
        await postBusinessTransactionUseCase.execute(transactionPayload);
      if (!transactionResult.success) {
        setErrorMessage(
          `Bill saved, but payment posting failed: ${transactionResult.error.message}`,
        );
        await loadOverview();
        return;
      }

      const allocationResult = await saveBillingDocumentAllocationsUseCase.execute([
        {
          remoteId: createAllocationRemoteId(),
          accountRemoteId: result.value.accountRemoteId,
          documentRemoteId: result.value.remoteId,
          settlementLedgerEntryRemoteId: null,
          settlementTransactionRemoteId: transactionRemoteId,
          amount: paidNowAmount,
          settledAt: normalizedIssuedAt,
          note: form.notes.trim() || null,
        },
      ]);

      if (!allocationResult.success) {
        await deleteBusinessTransactionUseCase.execute(transactionRemoteId);
        setErrorMessage(
          `Bill saved, but payment allocation failed: ${allocationResult.error.message}`,
        );
        await loadOverview();
        return;
      }
    }

    setIsEditorVisible(false);
    setForm(createEmptyForm(defaultTaxRatePercent));
    await loadOverview();
  }, [
    accountDisplayNameSnapshot,
    accountRemoteId,
    availableSettlementAccounts,
    canManage,
    defaultTaxRatePercent,
    deleteBusinessTransactionUseCase,
    documents,
    draftTotals.totalAmount,
    form,
    loadOverview,
    ownerUserRemoteId,
    postBusinessTransactionUseCase,
    saveBillingDocumentAllocationsUseCase,
    saveBillingDocumentUseCase,
    currencyCode,
  ]);

  const onDelete = useCallback(async (document: BillingDocument) => {
    const result = await deleteBillingDocumentUseCase.execute(document.remoteId);
    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }
    await loadOverview();
  }, [deleteBillingDocumentUseCase, loadOverview]);

  const exportDraftDocument = useCallback(async (action: "print" | "share" | "save") => {
    const html = buildBillingDraftHtml(
      form,
      draftTotals.subtotalAmount,
      draftTotals.taxAmount,
      draftTotals.totalAmount,
      currencyCode,
      regionalFinancePolicy.countryCode,
    );
    const titlePrefix = form.documentType === BillingDocumentType.Receipt ? "receipt" : "invoice";
    const result = await exportDocument({
      html,
      action,
      fileName: `${titlePrefix}_${form.customerName || "document"}_${form.issuedAt || Date.now()}`,
      title: `eLekha ${titlePrefix}`,
    });
    if (!result.success) {
      setErrorMessage(result.error);
      return;
    }
    setErrorMessage(null);
  }, [
    currencyCode,
    draftTotals.subtotalAmount,
    draftTotals.taxAmount,
    draftTotals.totalAmount,
    form,
    regionalFinancePolicy.countryCode,
  ]);

  const onPrintPreview = useCallback(() => {
    void exportDraftDocument("print");
  }, [exportDraftDocument]);

  const onExportPdf = useCallback(() => {
    void exportDraftDocument("save");
  }, [exportDraftDocument]);

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
    countryCode: regionalFinancePolicy.countryCode,
    taxLabel: regionalFinancePolicy.taxLabel,
    taxRateOptions,
    availableSettlementAccounts,
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
  }), [
    activeTab,
    activeTemplateType,
    billPhotos,
    canManage,
    currencyCode,
    draftTotals,
    editorTitle,
    errorMessage,
    filteredDocuments,
    form,
    isEditorVisible,
    isLoading,
    isTemplateModalVisible,
    loadOverview,
    onAddLineItem,
    onCloseEditor,
    onDelete,
    onExportPdf,
    onFormChange,
    onLineItemChange,
    onOpenCreate,
    onOpenEdit,
    onPrintPreview,
    onRemoveLineItem,
    onSubmit,
    onUploadBillPhoto,
    regionalFinancePolicy.countryCode,
    regionalFinancePolicy.taxLabel,
    summary,
    taxRateOptions,
    availableSettlementAccounts,
  ]);
};
