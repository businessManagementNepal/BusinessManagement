import React, { useCallback, useMemo } from "react";
import type { PosPaymentPartInput } from "../types/pos.dto.types";
import type { PosScreenCoordinatorState } from "../types/pos.state.types";
import type { PosCheckoutMode, PosCheckoutSubmissionKind } from "../types/pos.workflow.types";
import {
  parseAmountInput,
  type PosSessionStateOverrides,
} from "./internal/posScreen.shared";
import type { PosCheckoutViewModel } from "./posCheckout.viewModel";

interface UsePosCheckoutViewModelParams {
  state: PosScreenCoordinatorState;
  setState: React.Dispatch<React.SetStateAction<PosScreenCoordinatorState>>;
  saveCurrentSession: (
    overrides?: PosSessionStateOverrides,
  ) => Promise<void>;
  runCheckoutSubmission: (
    kind: PosCheckoutSubmissionKind,
    operation: () => Promise<boolean>,
  ) => Promise<boolean>;
  submitCheckout: (
    mode: PosCheckoutMode,
    paymentParts: readonly PosPaymentPartInput[],
  ) => Promise<boolean>;
}

const buildNormalPaymentParts = (
  paidAmount: number,
  settlementAccountRemoteId: string,
): readonly PosPaymentPartInput[] =>
  paidAmount > 0
    ? [
        {
          paymentPartId: "part-1",
          payerLabel: null,
          amount: paidAmount,
          settlementAccountRemoteId,
        },
      ]
    : [];

export function usePosCheckoutViewModel({
  state,
  setState,
  saveCurrentSession,
  runCheckoutSubmission,
  submitCheckout,
}: UsePosCheckoutViewModelParams): PosCheckoutViewModel {
  const validatePaymentCheckout = useCallback((): string | null => {
    const paidAmount = parseAmountInput(state.paymentInput);
    const settlementAccountRemoteId =
      state.selectedSettlementAccountRemoteId.trim();
    const dueAmount = Number((state.totals.grandTotal - paidAmount).toFixed(2));

    if (paidAmount > 0 && !settlementAccountRemoteId) {
      return "Select a settlement money account for paid sales.";
    }

    if (dueAmount > 0 && !state.selectedCustomer) {
      return "Select a customer to continue with unpaid or partial payment.";
    }

    return null;
  }, [
    state.paymentInput,
    state.selectedCustomer,
    state.selectedSettlementAccountRemoteId,
    state.totals.grandTotal,
  ]);

  const onPaymentInputChange = useCallback(
    (value: string) => {
      setState((currentState) => ({ ...currentState, paymentInput: value }));
    },
    [setState],
  );

  const onSettlementAccountChange = useCallback(
    (settlementAccountRemoteId: string) => {
      setState((currentState) => ({
        ...currentState,
        selectedSettlementAccountRemoteId: settlementAccountRemoteId,
        errorMessage: null,
      }));
      void saveCurrentSession({
        selectedSettlementAccountRemoteId: settlementAccountRemoteId,
      });
    },
    [saveCurrentSession, setState],
  );

  const onOpenPaymentModal = useCallback(() => {
    setState((currentState) => {
      if (currentState.isCheckoutSubmitting) {
        return currentState;
      }

      return {
        ...currentState,
        activeModal: "payment",
        paymentInput:
          currentState.paymentInput ||
          currentState.totals.grandTotal.toFixed(2),
        errorMessage: null,
        infoMessage: null,
      };
    });
  }, [setState]);

  const onClosePaymentModal = useCallback(() => {
    setState((currentState) => {
      if (currentState.isCheckoutSubmitting) {
        return currentState;
      }

      return {
        ...currentState,
        activeModal: "none",
      };
    });
  }, [setState]);

  const onConfirmPayment = useCallback(async () => {
    const validationError = validatePaymentCheckout();
    if (validationError) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: validationError,
      }));
      return;
    }

    const paidAmount = parseAmountInput(state.paymentInput);
    const settlementAccountRemoteId =
      state.selectedSettlementAccountRemoteId.trim();
    const paymentParts = buildNormalPaymentParts(
      paidAmount,
      settlementAccountRemoteId,
    );

    await runCheckoutSubmission("payment", async () =>
      submitCheckout("payment", paymentParts),
    );
  }, [
    runCheckoutSubmission,
    setState,
    state.paymentInput,
    state.selectedSettlementAccountRemoteId,
    submitCheckout,
    validatePaymentCheckout,
  ]);

  return useMemo(
    () => ({
      totals: state.totals,
      selectedCustomer: state.selectedCustomer,
      paymentInput: state.paymentInput,
      selectedSettlementAccountRemoteId: state.selectedSettlementAccountRemoteId,
      moneyAccountOptions: state.moneyAccountOptions,
      isPaymentModalVisible: state.activeModal === "payment",
      isPaymentSubmitting:
        state.isCheckoutSubmitting && state.checkoutSubmissionKind === "payment",
      onPaymentInputChange,
      onSettlementAccountChange,
      onOpenPaymentModal,
      onClosePaymentModal,
      onConfirmPayment,
    }),
    [
      onClosePaymentModal,
      onConfirmPayment,
      onOpenPaymentModal,
      onPaymentInputChange,
      onSettlementAccountChange,
      state.activeModal,
      state.checkoutSubmissionKind,
      state.isCheckoutSubmitting,
      state.moneyAccountOptions,
      state.paymentInput,
      state.selectedCustomer,
      state.selectedSettlementAccountRemoteId,
      state.totals,
    ],
  );
}
