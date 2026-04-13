import { BillingDocument, BillingDocumentType } from "@/feature/billing/types/billing.types";
import { exportDocument } from "@/shared/utils/document/exportDocument";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

export type PosSaleHistoryState = {
  receipts: BillingDocument[];
  filteredReceipts: BillingDocument[];
  isLoading: boolean;
  searchTerm: string;
  selectedReceipt: BillingDocument | null;
  activeModal: "history" | "detail" | "none";
  errorMessage: string | null;
};

export type PosSaleHistoryViewModel = {
  state: PosSaleHistoryState;
  receipts: BillingDocument[];
  isLoading: boolean;
  searchTerm: string;
  selectedReceipt: BillingDocument | null;
  activeModal: "history" | "detail" | "none";
  errorMessage: string | null;
  onSearchChange: (value: string) => void;
  onReceiptPress: (receipt: BillingDocument) => void;
  onPrintReceipt: (receipt: BillingDocument) => Promise<void>;
  onShareReceipt: (receipt: BillingDocument) => Promise<void>;
  onCloseHistory: () => void;
  onCloseDetail: () => void;
  onLoadReceipts: () => Promise<void>;
};

export type PosSaleHistoryViewModelParams = {
  accountRemoteId: string;
  currencyCode: string;
  countryCode: string | null;
  getBillingOverviewUseCase: {
    execute: (accountRemoteId: string) => Promise<any>;
  };
  buildBillingDraftHtml: (
    form: any,
    subtotalAmount: number,
    taxAmount: number,
    totalAmount: number,
    currencyCode: string,
    countryCode: string | null,
  ) => string;
};

const INITIAL_STATE: PosSaleHistoryState = {
  receipts: [],
  filteredReceipts: [],
  isLoading: false,
  searchTerm: "",
  selectedReceipt: null,
  activeModal: "none",
  errorMessage: null,
};

export const createPosSaleHistoryViewModel = ({
  accountRemoteId,
  currencyCode,
  countryCode,
  getBillingOverviewUseCase,
  buildBillingDraftHtml,
}: PosSaleHistoryViewModelParams): PosSaleHistoryViewModel => {
  const [state, setState] = useState<PosSaleHistoryState>(INITIAL_STATE);

  const filteredReceipts = useMemo(() => {
    if (!state.searchTerm.trim()) {
      return state.receipts;
    }

    const searchTerm = state.searchTerm.toLowerCase();
    return state.receipts.filter((receipt) => 
      receipt.documentNumber.toLowerCase().includes(searchTerm) ||
      receipt.customerName.toLowerCase().includes(searchTerm)
    );
  }, [state.receipts, state.searchTerm]);

  const onLoadReceipts = useCallback(async () => {
    setState((currentState) => ({
      ...currentState,
      isLoading: true,
      errorMessage: null,
    }));

    try {
      const result = await getBillingOverviewUseCase.execute(accountRemoteId);

      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          isLoading: false,
          errorMessage: result.error.message,
        }));
        return;
      }

      // Filter only receipt documents and sort by newest first
      const receipts = result.value.documents
        .filter((doc: BillingDocument) => 
          doc.documentType === BillingDocumentType.Receipt &&
          doc.templateType === "pos_receipt"
        )
        .sort((a: BillingDocument, b: BillingDocument) => 
          b.issuedAt - a.issuedAt
        );

      setState((currentState) => ({
        ...currentState,
        receipts,
        filteredReceipts: receipts,
        isLoading: false,
      }));
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        isLoading: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : "Failed to load receipts",
      }));
    }
  }, [accountRemoteId, getBillingOverviewUseCase]);

  const onSearchChange = useCallback((value: string) => {
    setState((currentState) => ({
      ...currentState,
      searchTerm: value,
    }));
  }, []);

  const onReceiptPress = useCallback((receipt: BillingDocument) => {
    setState((currentState) => ({
      ...currentState,
      selectedReceipt: receipt,
      activeModal: "detail",
    }));
  }, []);

  const onPrintReceipt = useCallback(async (receipt: BillingDocument) => {
    try {
      // Convert BillingDocument to form format for printing
      const form = {
        documentType: "receipt",
        documentNumber: receipt.documentNumber,
        customerName: receipt.customerName,
        issuedAt: new Date(receipt.issuedAt).toISOString().slice(0, 10),
        notes: receipt.notes,
        items: receipt.items.map((item: any) => ({
          remoteId: item.remoteId,
          itemName: item.itemName,
          quantity: item.quantity.toString(),
          unitRate: item.unitRate.toString(),
        })),
      };

      const html = buildBillingDraftHtml(
        form,
        receipt.subtotalAmount,
        receipt.taxAmount,
        receipt.totalAmount,
        currencyCode,
        countryCode,
      );

      const result = await exportDocument({
        html,
        fileName: `receipt_${receipt.documentNumber}.pdf`,
        title: `Receipt ${receipt.documentNumber}`,
        action: "print",
      });

      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: result.error,
        }));
        return;
      }

      setState((currentState) => ({
        ...currentState,
        infoMessage: `Receipt ${receipt.documentNumber} sent to print.`,
      }));
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        errorMessage:
          error instanceof Error
            ? error.message
            : "Failed to print receipt",
      }));
    }
  }, [buildBillingDraftHtml, currencyCode, countryCode]);

  const onShareReceipt = useCallback(async (receipt: BillingDocument) => {
    if (Platform.OS === "web") {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Sharing is not available in this web build.",
      }));
      return;
    }

    try {
      // Convert BillingDocument to form format for sharing
      const form = {
        documentType: "receipt",
        documentNumber: receipt.documentNumber,
        customerName: receipt.customerName,
        issuedAt: new Date(receipt.issuedAt).toISOString().slice(0, 10),
        notes: receipt.notes,
        items: receipt.items.map((item: any) => ({
          remoteId: item.remoteId,
          itemName: item.itemName,
          quantity: item.quantity.toString(),
          unitRate: item.unitRate.toString(),
        })),
      };

      const html = buildBillingDraftHtml(
        form,
        receipt.subtotalAmount,
        receipt.taxAmount,
        receipt.totalAmount,
        currencyCode,
        countryCode,
      );

      const result = await exportDocument({
        html,
        fileName: `receipt_${receipt.documentNumber}.pdf`,
        title: `Receipt ${receipt.documentNumber}`,
        action: "share",
      });

      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: result.error,
        }));
        return;
      }

      setState((currentState) => ({
        ...currentState,
        infoMessage: `Receipt ${receipt.documentNumber} shared successfully.`,
      }));
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        errorMessage:
          error instanceof Error
            ? error.message
            : "Failed to share receipt",
      }));
    }
  }, [buildBillingDraftHtml, currencyCode, countryCode]);

  const onCloseHistory = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "none",
      searchTerm: "",
    }));
  }, []);

  const onCloseDetail = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      selectedReceipt: null,
      activeModal: "history",
    }));
  }, []);

  // Load receipts when history modal opens
  useEffect(() => {
    if (state.activeModal === "history" && state.receipts.length === 0) {
      onLoadReceipts();
    }
  }, [state.activeModal, state.receipts.length, onLoadReceipts]);

  return {
    state,
    receipts: filteredReceipts,
    isLoading: state.isLoading,
    searchTerm: state.searchTerm,
    selectedReceipt: state.selectedReceipt,
    activeModal: state.activeModal,
    errorMessage: state.errorMessage,
    onSearchChange,
    onReceiptPress,
    onPrintReceipt,
    onShareReceipt,
    onCloseHistory,
    onCloseDetail,
    onLoadReceipts,
  };
};
