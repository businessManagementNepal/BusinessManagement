import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  PosSaleHistoryItem,
  PosSaleReconciliation,
} from "../types/posSaleHistory.entity.types";
import type { GetPosSaleHistoryUseCase } from "../useCase/getPosSaleHistory.useCase";
import type { PrintPosReceiptUseCase } from "../useCase/printPosReceipt.useCase";
import type { SharePosReceiptUseCase } from "../useCase/sharePosReceipt.useCase";
import {
  isPosSaleCleanupAllowedWorkflowStatus,
  isPosSaleRetryableWorkflowStatus,
} from "../utils/posSaleRecoveryStatus.util";
import type { PosSaleHistoryViewModel } from "./posSaleHistory.viewModel";
import type { ReconcilePosSaleUseCase } from "../workflow/posRecovery/useCase/reconcilePosSale.useCase";
import type { RetryPosSalePostingUseCase } from "../workflow/posRecovery/useCase/retryPosSalePosting.useCase";
import type { ResolvePosAbnormalSaleUseCase } from "../workflow/posRecovery/useCase/resolvePosAbnormalSale.useCase";

interface UsePosSaleHistoryViewModelParams {
  accountRemoteId: string;
  currencyCode: string;
  countryCode: string | null;
  getPosSaleHistoryUseCase: GetPosSaleHistoryUseCase;
  printPosReceiptUseCase: PrintPosReceiptUseCase;
  sharePosReceiptUseCase: SharePosReceiptUseCase;
  reconcilePosSaleUseCase: ReconcilePosSaleUseCase;
  resolvePosAbnormalSaleUseCase: ResolvePosAbnormalSaleUseCase;
  retryPosSalePostingUseCase: RetryPosSalePostingUseCase;
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
  reconciliation: PosSaleReconciliation | null;
  isReconciling: boolean;
  isResolving: boolean;
  isRetrying: boolean;
  recoveryMessage: string | null;
};

const INITIAL_STATE: PosSaleHistoryViewModelState = {
  receipts: [],
  filteredReceipts: [],
  isLoading: false,
  searchTerm: "",
  selectedReceipt: null,
  activeModal: "none",
  errorMessage: null,
  reconciliation: null,
  isReconciling: false,
  isResolving: false,
  isRetrying: false,
  recoveryMessage: null,
};

const isRecoverableSale = (receipt: PosSaleHistoryItem | null): boolean => {
  if (!receipt) {
    return false;
  }

  return isPosSaleRetryableWorkflowStatus(receipt.workflowStatus);
};

const isCleanupAllowedSale = (receipt: PosSaleHistoryItem | null): boolean => {
  if (!receipt) {
    return false;
  }

  return isPosSaleCleanupAllowedWorkflowStatus(receipt.workflowStatus);
};

export function usePosSaleHistoryViewModel({
  accountRemoteId,
  currencyCode,
  countryCode,
  getPosSaleHistoryUseCase,
  printPosReceiptUseCase,
  sharePosReceiptUseCase,
  reconcilePosSaleUseCase,
  resolvePosAbnormalSaleUseCase,
  retryPosSalePostingUseCase,
}: UsePosSaleHistoryViewModelParams): PosSaleHistoryViewModel {
  const [state, setState] = useState<PosSaleHistoryViewModelState>(INITIAL_STATE);
  const historySearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historySearchRequestIdRef = useRef(0);

  const loadReceipts = useCallback(
    async (
      searchTerm: string,
      requestId?: number,
    ): Promise<readonly PosSaleHistoryItem[] | null> => {
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
        return null;
      }

      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          isLoading: false,
          errorMessage: result.error.message,
          receipts: [],
          filteredReceipts: [],
        }));
        return null;
      }

      const receipts = [...result.value];

      setState((currentState) => ({
        ...currentState,
        receipts,
        filteredReceipts: receipts,
        isLoading: false,
        selectedReceipt: currentState.selectedReceipt
          ? receipts.find(
              (item) =>
                item.sale.remoteId === currentState.selectedReceipt?.sale.remoteId,
            ) ?? currentState.selectedReceipt
          : null,
      }));

      return receipts;
    },
    [accountRemoteId, getPosSaleHistoryUseCase],
  );

  const loadReconciliationForReceipt = useCallback(
    async (receipt: PosSaleHistoryItem) => {
      if (!isRecoverableSale(receipt)) {
        setState((currentState) => ({
          ...currentState,
          reconciliation: null,
          isReconciling: false,
        }));
        return;
      }

      setState((currentState) => ({
        ...currentState,
        isReconciling: true,
        errorMessage: null,
        recoveryMessage: null,
      }));

      const result = await reconcilePosSaleUseCase.execute({
        sale: receipt.sale,
      });

      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          isReconciling: false,
          reconciliation: null,
          errorMessage: result.error.message,
        }));
        return;
      }

      setState((currentState) => {
        if (currentState.selectedReceipt?.sale.remoteId !== receipt.sale.remoteId) {
          return currentState;
        }

        return {
          ...currentState,
          reconciliation: result.value,
          isReconciling: false,
        };
      });
    },
    [reconcilePosSaleUseCase],
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

  const onReceiptPress = useCallback(
    (receipt: PosSaleHistoryItem) => {
      setState((currentState) => ({
        ...currentState,
        selectedReceipt: receipt,
        activeModal: "detail",
        reconciliation: null,
        recoveryMessage: null,
        errorMessage: null,
      }));

      if (isRecoverableSale(receipt)) {
        void loadReconciliationForReceipt(receipt);
      }
    },
    [loadReconciliationForReceipt],
  );

  const onPrintReceipt = useCallback(
    async (receipt: PosSaleHistoryItem) => {
      const result = await printPosReceiptUseCase.execute({
        receipt: receipt.receipt,
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
      const result = await sharePosReceiptUseCase.execute({
        receipt: receipt.receipt,
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
      reconciliation: null,
      recoveryMessage: null,
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
      reconciliation: null,
      isReconciling: false,
      isResolving: false,
      recoveryMessage: null,
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (historySearchDebounceRef.current) {
        clearTimeout(historySearchDebounceRef.current);
      }
    };
  }, []);

  const onLoadReceipts = useCallback(async () => {
    const requestId = ++historySearchRequestIdRef.current;
    await loadReceipts(state.searchTerm, requestId);
  }, [loadReceipts, state.searchTerm]);

  const onCloseDetail = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "history",
      selectedReceipt: null,
      reconciliation: null,
      isReconciling: false,
      isResolving: false,
      recoveryMessage: null,
    }));
  }, []);

  const onRefreshReconciliation = useCallback(async () => {
    if (!state.selectedReceipt) {
      return;
    }

    await loadReconciliationForReceipt(state.selectedReceipt);
  }, [loadReconciliationForReceipt, state.selectedReceipt]);

  const onRetryAbnormalSale = useCallback(async () => {
    const selectedReceipt = state.selectedReceipt;
    if (!selectedReceipt || !isRecoverableSale(selectedReceipt)) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      isRetrying: true,
      errorMessage: null,
      recoveryMessage: null,
    }));

    const result = await retryPosSalePostingUseCase.execute({
      sale: selectedReceipt.sale,
    });

    const refreshedReceipts = await loadReceipts(state.searchTerm);
    const refreshedSelectedReceipt =
      refreshedReceipts?.find(
        (item) => item.sale.remoteId === selectedReceipt.sale.remoteId,
      ) ?? null;

    setState((currentState) => ({
      ...currentState,
      isRetrying: false,
      selectedReceipt: refreshedSelectedReceipt,
      reconciliation: null,
      recoveryMessage: result.success
        ? "Retry completed. POS sale posting is now synchronized."
        : null,
      errorMessage: result.success ? null : result.error.message,
    }));

    if (refreshedSelectedReceipt && isRecoverableSale(refreshedSelectedReceipt)) {
      await loadReconciliationForReceipt(refreshedSelectedReceipt);
    }
  }, [
    loadReceipts,
    loadReconciliationForReceipt,
    retryPosSalePostingUseCase,
    state.searchTerm,
    state.selectedReceipt,
  ]);

  const onCleanupAbnormalSale = useCallback(async () => {
    const selectedReceipt = state.selectedReceipt;
    if (!selectedReceipt || !isCleanupAllowedSale(selectedReceipt)) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      isResolving: true,
      errorMessage: null,
      recoveryMessage: null,
    }));

    const result = await resolvePosAbnormalSaleUseCase.execute({
      sale: selectedReceipt.sale,
    });

    const refreshedReceipts = await loadReceipts(state.searchTerm);
    const refreshedSelectedReceipt =
      refreshedReceipts?.find(
        (item) => item.sale.remoteId === selectedReceipt.sale.remoteId,
      ) ?? null;

    setState((currentState) => ({
      ...currentState,
      isResolving: false,
      selectedReceipt: refreshedSelectedReceipt,
      reconciliation: null,
      recoveryMessage: result.success
        ? result.value.wasFullyCleaned
          ? "Cleanup completed. Remaining linked inventory and accounting artifacts were cleared."
          : "Cleanup updated the sale, but some linked inventory or accounting artifacts still remain."
        : null,
      errorMessage: result.success ? null : result.error.message,
    }));

    if (refreshedSelectedReceipt && isRecoverableSale(refreshedSelectedReceipt)) {
      await loadReconciliationForReceipt(refreshedSelectedReceipt);
    }
  }, [
    loadReceipts,
    loadReconciliationForReceipt,
    resolvePosAbnormalSaleUseCase,
    state.searchTerm,
    state.selectedReceipt,
  ]);

  return useMemo(
    () => ({
      receipts: state.filteredReceipts,
      isLoading: state.isLoading,
      searchTerm: state.searchTerm,
      selectedReceipt: state.selectedReceipt,
      activeModal: state.activeModal,
      errorMessage: state.errorMessage,
      reconciliation: state.reconciliation,
      isReconciling: state.isReconciling,
      isResolving: state.isResolving,
      isRetrying: state.isRetrying,
      recoveryMessage: state.recoveryMessage,
      onSearchChange,
      onReceiptPress,
      onPrintReceipt,
      onShareReceipt,
      onOpenHistory,
      onCloseHistory,
      onCloseDetail,
      onLoadReceipts,
      onRefreshReconciliation,
      onRetryAbnormalSale,
      onCleanupAbnormalSale,
    }),
    [
      onCleanupAbnormalSale,
      onCloseDetail,
      onCloseHistory,
      onLoadReceipts,
      onOpenHistory,
      onPrintReceipt,
      onReceiptPress,
      onRefreshReconciliation,
      onRetryAbnormalSale,
      onSearchChange,
      onShareReceipt,
      state.activeModal,
      state.errorMessage,
      state.filteredReceipts,
      state.isLoading,
      state.isReconciling,
      state.isRetrying,
      state.isResolving,
      state.reconciliation,
      state.recoveryMessage,
      state.searchTerm,
      state.selectedReceipt,
    ],
  );
}
