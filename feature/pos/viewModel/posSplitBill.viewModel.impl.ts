import React, { useCallback, useMemo } from "react";
import type { PosPaymentPartInput } from "../types/pos.dto.types";
import type { PosSplitDraftPart } from "../types/pos.entity.types";
import type { PosScreenCoordinatorState } from "../types/pos.state.types";
import type { PosCheckoutMode, PosCheckoutSubmissionKind } from "../types/pos.workflow.types";
import {
  buildEqualSplitDraftParts,
  getSplitDraftSummary,
  parseAmountInput,
  validateSplitBillDraft,
  type PosSessionStateOverrides,
} from "./internal/posScreen.shared";
import type { PosSplitBillViewModel } from "./posSplitBill.viewModel";

interface UsePosSplitBillViewModelParams {
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

const createSplitPartId = (): string =>
  `part-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function usePosSplitBillViewModel({
  state,
  setState,
  saveCurrentSession,
  runCheckoutSubmission,
  submitCheckout,
}: UsePosSplitBillViewModelParams): PosSplitBillViewModel {
  const splitBillSummary = useMemo(
    () =>
      getSplitDraftSummary(state.splitBillDraftParts, state.totals.grandTotal),
    [state.splitBillDraftParts, state.totals.grandTotal],
  );

  const onOpenSplitBillModal = useCallback(() => {
    setState((currentState) => {
      if (currentState.isCheckoutSubmitting) {
        return currentState;
      }

      return {
        ...currentState,
        activeModal: "split-bill",
        splitBillDraftParts:
          currentState.splitBillDraftParts.length > 0
            ? currentState.splitBillDraftParts
            : buildEqualSplitDraftParts(
                2,
                currentState.totals.grandTotal,
                currentState.selectedSettlementAccountRemoteId,
              ),
        splitBillErrorMessage: null,
      };
    });
  }, [setState]);

  const onCloseSplitBillModal = useCallback(() => {
    setState((currentState) => {
      if (currentState.isCheckoutSubmitting) {
        return currentState;
      }

      return {
        ...currentState,
        activeModal: "none",
        splitBillErrorMessage: null,
      };
    });
  }, [setState]);

  const onApplyEqualSplit = useCallback(
    async (count: number) => {
      const equalParts = buildEqualSplitDraftParts(
        count,
        state.totals.grandTotal,
        state.selectedSettlementAccountRemoteId,
      );
      setState((currentState) => ({
        ...currentState,
        splitBillDraftParts: equalParts,
        splitBillErrorMessage: null,
      }));

      await saveCurrentSession({
        splitBillDraftParts: equalParts,
      });
    },
    [
      saveCurrentSession,
      setState,
      state.selectedSettlementAccountRemoteId,
      state.totals.grandTotal,
    ],
  );

  const onAddSplitBillPart = useCallback(async () => {
    const newPart: PosSplitDraftPart = {
      paymentPartId: createSplitPartId(),
      payerLabel: `Friend ${state.splitBillDraftParts.length + 1}`,
      amountInput: "",
      settlementAccountRemoteId: state.selectedSettlementAccountRemoteId,
    };
    const updatedParts = [...state.splitBillDraftParts, newPart];
    setState((currentState) => ({
      ...currentState,
      splitBillDraftParts: updatedParts,
      splitBillErrorMessage: null,
    }));

    await saveCurrentSession({ splitBillDraftParts: updatedParts });
  }, [
    saveCurrentSession,
    setState,
    state.selectedSettlementAccountRemoteId,
    state.splitBillDraftParts,
  ]);

  const onRemoveSplitBillPart = useCallback(
    async (paymentPartId: string) => {
      const updatedParts = state.splitBillDraftParts.filter(
        (part) => part.paymentPartId !== paymentPartId,
      );
      setState((currentState) => ({
        ...currentState,
        splitBillDraftParts: updatedParts,
        splitBillErrorMessage: null,
      }));

      await saveCurrentSession({ splitBillDraftParts: updatedParts });
    },
    [saveCurrentSession, setState, state.splitBillDraftParts],
  );

  const onChangeSplitBillPartAmount = useCallback(
    async (paymentPartId: string, value: string) => {
      const updatedParts = state.splitBillDraftParts.map((part) =>
        part.paymentPartId === paymentPartId
          ? { ...part, amountInput: value }
          : part,
      );
      setState((currentState) => ({
        ...currentState,
        splitBillDraftParts: updatedParts,
        splitBillErrorMessage: null,
      }));

      await saveCurrentSession({ splitBillDraftParts: updatedParts });
    },
    [saveCurrentSession, setState, state.splitBillDraftParts],
  );

  const onChangeSplitBillPartPayerLabel = useCallback(
    async (paymentPartId: string, value: string) => {
      const updatedParts = state.splitBillDraftParts.map((part) =>
        part.paymentPartId === paymentPartId ? { ...part, payerLabel: value } : part,
      );
      setState((currentState) => ({
        ...currentState,
        splitBillDraftParts: updatedParts,
        splitBillErrorMessage: null,
      }));

      await saveCurrentSession({ splitBillDraftParts: updatedParts });
    },
    [saveCurrentSession, setState, state.splitBillDraftParts],
  );

  const onChangeSplitBillPartSettlementAccount = useCallback(
    async (paymentPartId: string, settlementAccountRemoteId: string) => {
      const updatedParts = state.splitBillDraftParts.map((part) =>
        part.paymentPartId === paymentPartId
          ? { ...part, settlementAccountRemoteId }
          : part,
      );
      setState((currentState) => ({
        ...currentState,
        splitBillDraftParts: updatedParts,
        splitBillErrorMessage: null,
      }));

      await saveCurrentSession({ splitBillDraftParts: updatedParts });
    },
    [saveCurrentSession, setState, state.splitBillDraftParts],
  );

  const onCompleteSplitBillPayment = useCallback(async () => {
    const validationError = validateSplitBillDraft(
      state.splitBillDraftParts,
      state.totals.grandTotal,
      state.selectedCustomer,
    );
    if (validationError) {
      setState((currentState) => ({
        ...currentState,
        splitBillErrorMessage: validationError,
      }));
      return;
    }

    const paymentParts: readonly PosPaymentPartInput[] = state.splitBillDraftParts.map(
      (part) => ({
        paymentPartId: part.paymentPartId,
        payerLabel: part.payerLabel.trim() || null,
        amount: parseAmountInput(part.amountInput),
        settlementAccountRemoteId: part.settlementAccountRemoteId,
      }),
    );

    await runCheckoutSubmission("split-bill", async () =>
      submitCheckout("split-bill", paymentParts),
    );
  }, [
    runCheckoutSubmission,
    setState,
    state.selectedCustomer,
    state.splitBillDraftParts,
    state.totals.grandTotal,
    submitCheckout,
  ]);

  return useMemo(
    () => ({
      grandTotal: state.totals.grandTotal,
      splitBillDraftParts: state.splitBillDraftParts,
      splitBillAllocatedAmount: splitBillSummary.allocatedAmount,
      splitBillRemainingAmount: splitBillSummary.remainingAmount,
      splitBillErrorMessage: state.splitBillErrorMessage,
      moneyAccountOptions: state.moneyAccountOptions,
      isSplitBillModalVisible: state.activeModal === "split-bill",
      isSplitBillSubmitting:
        state.isCheckoutSubmitting && state.checkoutSubmissionKind === "split-bill",
      onOpenSplitBillModal,
      onCloseSplitBillModal,
      onApplyEqualSplit,
      onAddSplitBillPart,
      onRemoveSplitBillPart,
      onChangeSplitBillPartPayerLabel,
      onChangeSplitBillPartAmount,
      onChangeSplitBillPartSettlementAccount,
      onCompleteSplitBillPayment,
    }),
    [
      onAddSplitBillPart,
      onApplyEqualSplit,
      onChangeSplitBillPartAmount,
      onChangeSplitBillPartPayerLabel,
      onChangeSplitBillPartSettlementAccount,
      onCloseSplitBillModal,
      onCompleteSplitBillPayment,
      onOpenSplitBillModal,
      onRemoveSplitBillPart,
      splitBillSummary.allocatedAmount,
      splitBillSummary.remainingAmount,
      state.activeModal,
      state.checkoutSubmissionKind,
      state.isCheckoutSubmitting,
      state.moneyAccountOptions,
      state.splitBillDraftParts,
      state.splitBillErrorMessage,
      state.totals.grandTotal,
    ],
  );
}
