import type { BillingDocument } from "@/feature/billing/types/billing.types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PosReceipt } from "../types/pos.entity.types";
import type { PosSaleHistoryItem } from "../types/posSaleHistory.entity.types";
import type { GetPosSaleHistoryUseCase } from "../useCase/getPosSaleHistory.useCase";
import type { PrintPosReceiptUseCase } from "../useCase/printPosReceipt.useCase";
import type { SharePosReceiptUseCase } from "../useCase/sharePosReceipt.useCase";
import type { PosSaleHistoryViewModel } from "./posSaleHistory.viewModel";

interface UsePosSaleHistoryViewModelParams {
  accountRemoteId: string;
  currencyCode: string;
  countryCode: string | null;
  getPosSaleHistoryUseCase: GetPosSaleHistoryUseCase;
  printPosReceiptUseCase: PrintPosReceiptUseCase;
  sharePosReceiptUseCase: SharePosReceiptUseCase;
}

type PosSaleHistoryModalState = "history" | "detail" | "none";

type PosSaleHistoryViewModelState = {
  receipts: PosSaleHistoryItem[];
  filteredReceipts: PosSaleHistoryItem[];
  isLoading: boolean;
  searchTerm: string;
  selectedReceipt: PosSaleHistoryItem | null;
  errorMessage: string | null;
  activeModal: PosSaleHistoryModalState;
};

const INITIAL_STATE: PosSaleHistoryViewModelState = {
  receipts: [],
  filteredReceipts: [],
  isLoading: false,
  searchTerm: "",
  selectedReceipt: null,
  activeModal: "none",
  errorMessage: null,
};

const buildShortCode = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "P";
  }

  const [firstWord, secondWord] = trimmed.split(" ").filter(Boolean);
  if (!secondWord) {
    return firstWord.slice(0, 1).toUpperCase();
  }

  return `${firstWord[0]}${secondWord[0]}`.toUpperCase();
};

const mapBillingDocumentToPosReceipt = (document: BillingDocument): PosReceipt => {
  const lines = document.items.map((item) => ({
    lineId: item.remoteId,
    productId: item.remoteId,
    productName: item.itemName,
    categoryLabel: "Sale",
    shortCode: buildShortCode(item.itemName),
    quantity: item.quantity,
    unitPrice: item.unitRate,
    taxRate: 0,
    lineSubtotal: Number((item.quantity * item.unitRate).toFixed(2)),
  }));

  return {
    receiptNumber: document.documentNumber,
    issuedAt: new Date(document.issuedAt).toISOString(),
    lines,
    totals: {
      itemCount: lines.reduce((total, line) => total + line.quantity, 0),
      gross: Number(document.subtotalAmount.toFixed(2)),
      discountAmount: 0,
      surchargeAmount: 0,
      taxAmount: Number(document.taxAmount.toFixed(2)),
      grandTotal: Number(document.totalAmount.toFixed(2)),
    },
    paidAmount: Number(document.paidAmount.toFixed(2)),
    dueAmount: Number(document.outstandingAmount.toFixed(2)),
    paymentParts: [],
    ledgerEffect:
      document.outstandingAmount > 0
        ? {
            type: "due_balance_pending",
            dueAmount: Number(document.outstandingAmount.toFixed(2)),
            accountRemoteId: document.accountRemoteId,
          }
        : {
            type: "none",
            dueAmount: 0,
            accountRemoteId: document.accountRemoteId,
          },
    customerName: document.customerName,
    customerPhone: null,
    contactRemoteId: document.contactRemoteId,
  };
};

export function usePosSaleHistoryViewModel({
  accountRemoteId,
  currencyCode,
  countryCode,
  getPosSaleHistoryUseCase,
  printPosReceiptUseCase,
  sharePosReceiptUseCase,
}: UsePosSaleHistoryViewModelParams): PosSaleHistoryViewModel {
  const [state, setState] = useState<PosSaleHistoryViewModelState>(INITIAL_STATE);
  const historySearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historySearchRequestIdRef = useRef(0);

  const loadReceipts = useCallback(
    async (searchTerm: string, requestId?: number) => {
      setState((currentState) => ({
        ...currentState,
        isLoading: true,
        errorMessage: null,
      }));

      const result = await getPosSaleHistoryUseCase.execute({
        accountRemoteId,
        searchTerm,
      });

      if (
        typeof requestId === "number" &&
        requestId !== historySearchRequestIdRef.current
      ) {
        return;
      }

      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          isLoading: false,
          errorMessage: result.error.message,
          receipts: [],
          filteredReceipts: [],
        }));
        return;
      }

      setState((currentState) => ({
        ...currentState,
        receipts: [...result.value],
        filteredReceipts: [...result.value],
        isLoading: false,
      }));
    },
    [accountRemoteId, getPosSaleHistoryUseCase],
  );

  const onSearchChange = useCallback(
    (value: string) => {
      setState((currentState) => ({
        ...currentState,
        searchTerm: value,
      }));

      if (historySearchDebounceRef.current) {
        clearTimeout(historySearchDebounceRef.current);
      }

      const requestId = ++historySearchRequestIdRef.current;
      historySearchDebounceRef.current = setTimeout(() => {
        void loadReceipts(value, requestId);
      }, 300);
    },
    [loadReceipts],
  );

  const onReceiptPress = useCallback((receipt: PosSaleHistoryItem) => {
    setState((currentState) => ({
      ...currentState,
      selectedReceipt: receipt,
      activeModal: "detail",
    }));
  }, []);

  const onPrintReceipt = useCallback(
    async (receipt: PosSaleHistoryItem) => {
      const mappedReceipt = mapBillingDocumentToPosReceipt(receipt.document);
      const result = await printPosReceiptUseCase.execute({
        receipt: mappedReceipt,
        currencyCode,
        countryCode,
      });

      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: result.error.message,
        }));
      }
    },
    [countryCode, currencyCode, printPosReceiptUseCase],
  );

  const onShareReceipt = useCallback(
    async (receipt: PosSaleHistoryItem) => {
      const mappedReceipt = mapBillingDocumentToPosReceipt(receipt.document);
      const result = await sharePosReceiptUseCase.execute({
        receipt: mappedReceipt,
        currencyCode,
        countryCode,
      });

      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: result.error.message,
        }));
      }
    },
    [countryCode, currencyCode, sharePosReceiptUseCase],
  );

  const onOpenHistory = useCallback(async () => {
    if (historySearchDebounceRef.current) {
      clearTimeout(historySearchDebounceRef.current);
    }
    const requestId = ++historySearchRequestIdRef.current;

    setState((currentState) => ({
      ...currentState,
      activeModal: "history",
    }));

    await loadReceipts(state.searchTerm || "", requestId);
  }, [loadReceipts, state.searchTerm]);

  const onCloseHistory = useCallback(() => {
    if (historySearchDebounceRef.current) {
      clearTimeout(historySearchDebounceRef.current);
    }
    historySearchRequestIdRef.current += 1;

    setState((currentState) => ({
      ...currentState,
      activeModal: "none",
      searchTerm: "",
      selectedReceipt: null,
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (historySearchDebounceRef.current) {
        clearTimeout(historySearchDebounceRef.current);
      }
    };
  }, []);

  const onLoadReceipts = useCallback(
    async () => {
      const requestId = ++historySearchRequestIdRef.current;
      await loadReceipts(state.searchTerm, requestId);
    },
    [loadReceipts, state.searchTerm],
  );

  const onCloseDetail = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "history",
      selectedReceipt: null,
    }));
  }, []);

  return useMemo(
    () => ({
      receipts: state.filteredReceipts,
      isLoading: state.isLoading,
      searchTerm: state.searchTerm,
      selectedReceipt: state.selectedReceipt,
      activeModal: state.activeModal,
      errorMessage: state.errorMessage,
      onSearchChange,
      onReceiptPress,
      onPrintReceipt,
      onShareReceipt,
      onOpenHistory,
      onCloseHistory,
      onCloseDetail,
      onLoadReceipts,
    }),
    [
      onLoadReceipts,
      onCloseDetail,
      onCloseHistory,
      onOpenHistory,
      onPrintReceipt,
      onReceiptPress,
      onSearchChange,
      onShareReceipt,
      state.activeModal,
      state.errorMessage,
      state.filteredReceipts,
      state.isLoading,
      state.searchTerm,
      state.selectedReceipt,
    ],
  );
}
