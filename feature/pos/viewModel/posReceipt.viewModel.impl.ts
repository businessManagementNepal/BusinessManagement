import React, { useCallback, useMemo } from "react";
import type { PosScreenCoordinatorState } from "../types/pos.state.types";
import type { PrintPosReceiptUseCase } from "../useCase/printPosReceipt.useCase";
import type { SharePosReceiptUseCase } from "../useCase/sharePosReceipt.useCase";
import type { PosReceiptViewModel } from "./posReceipt.viewModel";

interface UsePosReceiptViewModelParams {
  state: PosScreenCoordinatorState;
  setState: React.Dispatch<React.SetStateAction<PosScreenCoordinatorState>>;
  currencyCode: string;
  countryCode: string | null;
  printPosReceiptUseCase: PrintPosReceiptUseCase;
  sharePosReceiptUseCase: SharePosReceiptUseCase;
}

export function usePosReceiptViewModel({
  state,
  setState,
  currencyCode,
  countryCode,
  printPosReceiptUseCase,
  sharePosReceiptUseCase,
}: UsePosReceiptViewModelParams): PosReceiptViewModel {
  const onOpenReceiptModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "receipt",
    }));
  }, [setState]);

  const onCloseReceiptModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "none",
    }));
  }, [setState]);

  const onPrintReceipt = useCallback(async () => {
    if (!state.receipt) {
      return;
    }

    const result = await printPosReceiptUseCase.execute({
      receipt: state.receipt,
      currencyCode,
      countryCode,
    });
    if (!result.success) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: result.error.message,
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      infoMessage: `Receipt ${state.receipt?.receiptNumber ?? ""} sent to print.`,
    }));
  }, [countryCode, currencyCode, printPosReceiptUseCase, setState, state.receipt]);

  const onShareReceipt = useCallback(async () => {
    if (!state.receipt) {
      return;
    }

    const result = await sharePosReceiptUseCase.execute({
      receipt: state.receipt,
      currencyCode,
      countryCode,
    });
    if (!result.success) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: result.error.message,
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      infoMessage: `Receipt ${state.receipt?.receiptNumber ?? ""} shared successfully.`,
    }));
  }, [countryCode, currencyCode, setState, sharePosReceiptUseCase, state.receipt]);

  return useMemo(
    () => ({
      receipt: state.receipt,
      isReceiptModalVisible: state.activeModal === "receipt",
      onOpenReceiptModal,
      onCloseReceiptModal,
      onPrintReceipt,
      onShareReceipt,
    }),
    [
      onCloseReceiptModal,
      onOpenReceiptModal,
      onPrintReceipt,
      onShareReceipt,
      state.activeModal,
      state.receipt,
    ],
  );
}
