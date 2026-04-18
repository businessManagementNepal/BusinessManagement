import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";
import React, { useCallback, useMemo, useRef } from "react";
import type { PosPaymentPartInput } from "../types/pos.dto.types";
import type { PosReceipt } from "../types/pos.entity.types";
import type { PosScreenCoordinatorState } from "../types/pos.state.types";
import type {
  PosCheckoutMode,
  PosCheckoutSubmissionKind,
} from "../types/pos.workflow.types";
import type { ClearPosSessionUseCase } from "../useCase/clearPosSession.useCase";
import type { RunPosCheckoutUseCase } from "../workflow/posCheckout/useCase/runPosCheckout.useCase";
import {
  EMPTY_TOTALS,
  INITIAL_POS_SCREEN_COORDINATOR_STATE,
  parseAmountInput,
  type PosSessionStateOverrides,
} from "./internal/posScreen.shared";
import type { PosCheckoutViewModel } from "./posCheckout.viewModel";
import type { PosSplitBillViewModel } from "./posSplitBill.viewModel";
import { usePosSplitBillViewModel } from "./posSplitBill.viewModel.impl";

interface UsePosCheckoutFlowControllerParams {
  state: PosScreenCoordinatorState;
  setState: React.Dispatch<React.SetStateAction<PosScreenCoordinatorState>>;
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  currencyCode: string;
  countryCode: string | null;
  runPosCheckoutUseCase: RunPosCheckoutUseCase;
  clearPosSessionUseCase: ClearPosSessionUseCase;
}

interface PosCheckoutFlowController {
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

const createCheckoutIdempotencyKey = (
  submissionKind: PosCheckoutSubmissionKind,
): string => {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return `pos:${submissionKind}:${randomId}`;
  }

  return `pos:${submissionKind}:${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

export function usePosCheckoutFlowController({
  state,
  setState,
  activeBusinessAccountRemoteId,
  activeOwnerUserRemoteId,
  currencyCode,
  countryCode,
  runPosCheckoutUseCase,
  clearPosSessionUseCase,
}: UsePosCheckoutFlowControllerParams): PosCheckoutFlowController {
  const checkoutSubmissionRef = useRef<PosCheckoutSubmissionKind | null>(null);

  const beginCheckoutSubmission = useCallback(
    (kind: PosCheckoutSubmissionKind): boolean => {
      if (checkoutSubmissionRef.current !== null) {
        return false;
      }

      checkoutSubmissionRef.current = kind;
      setState((currentState) => ({
        ...currentState,
        isCheckoutSubmitting: true,
        checkoutSubmissionKind: kind,
        errorMessage: null,
        splitBillErrorMessage: null,
        infoMessage: null,
      }));

      return true;
    },
    [setState],
  );

  const endCheckoutSubmission = useCallback(() => {
    checkoutSubmissionRef.current = null;
    setState((currentState) => ({
      ...currentState,
      isCheckoutSubmitting: false,
      checkoutSubmissionKind: null,
    }));
  }, [setState]);

  const applySuccessfulCheckoutState = useCallback(
    (receipt: PosReceipt, infoMessage: string) => {
      setState((currentState) => ({
        ...currentState,
        cartLines: [],
        totals: EMPTY_TOTALS,
        activeModal: "receipt",
        discountInput: "",
        surchargeInput: "",
        paymentInput: "",
        receipt,
        filteredProducts: [],
        quickProductNameInput: "",
        quickProductPriceInput:
          INITIAL_POS_SCREEN_COORDINATOR_STATE.quickProductPriceInput,
        quickProductCategoryInput: "",
        splitBillDraftParts: [],
        splitBillErrorMessage: null,
        infoMessage,
        errorMessage: null,
      }));
    },
    [setState],
  );

  const finalizeSuccessfulCheckout = useCallback(
    async (receipt: PosReceipt) => {
      const infoMessage =
        receipt.ledgerEffect.type === "due_balance_created"
          ? `Sale completed. ${formatCurrencyAmount({
              amount: receipt.dueAmount,
              currencyCode,
              countryCode,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} was posted as ledger due.`
          : receipt.ledgerEffect.type === "due_balance_create_failed"
            ? `Sale completed. ${formatCurrencyAmount({
                amount: receipt.dueAmount,
                currencyCode,
                countryCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} due could not be posted automatically. Add it from Ledger.`
            : receipt.ledgerEffect.type === "posting_sync_failed"
              ? "Sale completed, but accounting sync failed. Please review Ledger/Billing."
              : "Sale completed successfully.";
      applySuccessfulCheckoutState(receipt, infoMessage);

      if (activeBusinessAccountRemoteId) {
        await clearPosSessionUseCase.execute({
          businessAccountRemoteId: activeBusinessAccountRemoteId,
        });
      }
    },
    [
      activeBusinessAccountRemoteId,
      applySuccessfulCheckoutState,
      clearPosSessionUseCase,
      countryCode,
      currencyCode,
    ],
  );

  const submitCheckout = useCallback(
    async (
      mode: PosCheckoutMode,
      paymentParts: readonly PosPaymentPartInput[],
    ): Promise<boolean> => {
      const submissionKind: PosCheckoutSubmissionKind =
        mode === "payment" ? "payment" : "split-bill";

      if (!beginCheckoutSubmission(submissionKind)) {
        return false;
      }

      try {
        const result = await runPosCheckoutUseCase.execute({
          idempotencyKey: createCheckoutIdempotencyKey(submissionKind),
          paymentParts,
          selectedCustomer: state.selectedCustomer,
          grandTotalSnapshot: state.totals.grandTotal,
          cartLinesSnapshot: state.cartLines,
          totalsSnapshot: state.totals,
          activeBusinessAccountRemoteId,
          activeOwnerUserRemoteId,
          activeAccountCurrencyCode: currencyCode,
          activeAccountCountryCode: countryCode,
        });

        if (!result.success) {
          setState((currentState) => ({
            ...currentState,
            errorMessage:
              mode === "payment"
                ? result.error.message
                : currentState.errorMessage,
            splitBillErrorMessage:
              mode === "split-bill"
                ? result.error.message
                : currentState.splitBillErrorMessage,
          }));
          return false;
        }

        const receipt = result.value.receipt;
        if (!receipt) {
          setState((currentState) => ({
            ...currentState,
            errorMessage:
              mode === "payment"
                ? "Checkout did not return a receipt."
                : currentState.errorMessage,
            splitBillErrorMessage:
              mode === "split-bill"
                ? "Checkout did not return a receipt."
                : currentState.splitBillErrorMessage,
          }));
          return false;
        }

        await finalizeSuccessfulCheckout(receipt);
        return true;
      } finally {
        endCheckoutSubmission();
      }
    },
    [
      activeBusinessAccountRemoteId,
      activeOwnerUserRemoteId,
      beginCheckoutSubmission,
      countryCode,
      currencyCode,
      endCheckoutSubmission,
      finalizeSuccessfulCheckout,
      runPosCheckoutUseCase,
      setState,
      state.cartLines,
      state.selectedCustomer,
      state.totals,
    ],
  );

  return useMemo(
    () => ({
      submitCheckout,
    }),
    [submitCheckout],
  );
}

interface UsePosCheckoutCoordinationParams {
  state: PosScreenCoordinatorState;
  setState: React.Dispatch<React.SetStateAction<PosScreenCoordinatorState>>;
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  currencyCode: string;
  countryCode: string | null;
  runPosCheckoutUseCase: RunPosCheckoutUseCase;
  clearPosSessionUseCase: ClearPosSessionUseCase;
  saveCurrentSession: (
    overrides?: PosSessionStateOverrides,
  ) => Promise<void>;
}

interface PosCheckoutCoordination {
  checkout: PosCheckoutViewModel;
  splitBill: PosSplitBillViewModel;
}

export function usePosCheckoutCoordination({
  state,
  setState,
  activeBusinessAccountRemoteId,
  activeOwnerUserRemoteId,
  currencyCode,
  countryCode,
  runPosCheckoutUseCase,
  clearPosSessionUseCase,
  saveCurrentSession,
}: UsePosCheckoutCoordinationParams): PosCheckoutCoordination {
  const checkoutFlow = usePosCheckoutFlowController({
    state,
    setState,
    activeBusinessAccountRemoteId,
    activeOwnerUserRemoteId,
    currencyCode,
    countryCode,
    runPosCheckoutUseCase,
    clearPosSessionUseCase,
  });

  const checkout = usePosCheckoutViewModel({
    state,
    setState,
    saveCurrentSession,
    submitCheckout: checkoutFlow.submitCheckout,
  });

  const splitBill = usePosSplitBillViewModel({
    state,
    setState,
    saveCurrentSession,
    submitCheckout: checkoutFlow.submitCheckout,
  });

  return useMemo(
    () => ({
      checkout,
      splitBill,
    }),
    [checkout, splitBill],
  );
}

interface UsePosCheckoutViewModelParams {
  state: PosScreenCoordinatorState;
  setState: React.Dispatch<React.SetStateAction<PosScreenCoordinatorState>>;
  saveCurrentSession: (
    overrides?: PosSessionStateOverrides,
  ) => Promise<void>;
  submitCheckout: (
    mode: PosCheckoutMode,
    paymentParts: readonly PosPaymentPartInput[],
  ) => Promise<boolean>;
}

export function usePosCheckoutViewModel({
  state,
  setState,
  saveCurrentSession,
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

    await submitCheckout("payment", paymentParts);
  }, [
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
