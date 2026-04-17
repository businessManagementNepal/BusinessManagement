import React, { useCallback, useMemo } from "react";
import type { PosCartLine } from "../types/pos.entity.types";
import type { PosScreenCoordinatorState } from "../types/pos.state.types";
import { ApplyDiscountUseCase } from "../useCase/applyDiscount.useCase";
import { ApplySurchargeUseCase } from "../useCase/applySurcharge.useCase";
import { ChangeCartLineQuantityUseCase } from "../useCase/changeCartLineQuantity.useCase";
import { ClearCartUseCase } from "../useCase/clearCart.useCase";
import { ClearPosSessionUseCase } from "../useCase/clearPosSession.useCase";
import {
  EMPTY_TOTALS,
  parseAmountInput,
  type PosSessionStateOverrides,
} from "./internal/posScreen.shared";
import type { PosCartViewModel } from "./posCart.viewModel";

interface UsePosCartViewModelParams {
  state: PosScreenCoordinatorState;
  setState: React.Dispatch<React.SetStateAction<PosScreenCoordinatorState>>;
  activeBusinessAccountRemoteId: string | null;
  changeCartLineQuantityUseCase: ChangeCartLineQuantityUseCase;
  applyDiscountUseCase: ApplyDiscountUseCase;
  applySurchargeUseCase: ApplySurchargeUseCase;
  clearCartUseCase: ClearCartUseCase;
  clearPosSessionUseCase: ClearPosSessionUseCase;
  saveCurrentSession: (
    overrides?: PosSessionStateOverrides,
  ) => Promise<void>;
  recalculateTotals: (cartLines: readonly PosCartLine[]) => void;
}

export function usePosCartViewModel({
  state,
  setState,
  activeBusinessAccountRemoteId,
  changeCartLineQuantityUseCase,
  applyDiscountUseCase,
  applySurchargeUseCase,
  clearCartUseCase,
  clearPosSessionUseCase,
  saveCurrentSession,
  recalculateTotals,
}: UsePosCartViewModelParams): PosCartViewModel {
  const onIncreaseQuantity = useCallback(
    async (lineId: string) => {
      const line = state.cartLines.find((item) => item.lineId === lineId);
      if (!line) {
        return;
      }

      const result = await changeCartLineQuantityUseCase.execute({
        lineId,
        nextQuantity: line.quantity + 1,
      });
      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: result.error.message,
        }));
        return;
      }

      recalculateTotals(result.value);
      await saveCurrentSession({ cartLines: result.value });
    },
    [
      changeCartLineQuantityUseCase,
      recalculateTotals,
      saveCurrentSession,
      setState,
      state.cartLines,
    ],
  );

  const onDecreaseQuantity = useCallback(
    async (lineId: string) => {
      const line = state.cartLines.find((item) => item.lineId === lineId);
      if (!line) {
        return;
      }

      const result = await changeCartLineQuantityUseCase.execute({
        lineId,
        nextQuantity: line.quantity - 1,
      });
      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: result.error.message,
        }));
        return;
      }

      recalculateTotals(result.value);
      await saveCurrentSession({ cartLines: result.value });
    },
    [
      changeCartLineQuantityUseCase,
      recalculateTotals,
      saveCurrentSession,
      setState,
      state.cartLines,
    ],
  );

  const onRemoveCartLine = useCallback(
    async (lineId: string) => {
      const result = await changeCartLineQuantityUseCase.execute({
        lineId,
        nextQuantity: 0,
      });
      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: result.error.message,
        }));
        return;
      }

      recalculateTotals(result.value);
      await saveCurrentSession({ cartLines: result.value });
    },
    [changeCartLineQuantityUseCase, recalculateTotals, saveCurrentSession, setState],
  );

  const onDiscountInputChange = useCallback(
    async (value: string) => {
      setState((currentState) => ({ ...currentState, discountInput: value }));
      await saveCurrentSession({ discountInput: value });
    },
    [saveCurrentSession, setState],
  );

  const onSurchargeInputChange = useCallback(
    async (value: string) => {
      setState((currentState) => ({ ...currentState, surchargeInput: value }));
      await saveCurrentSession({ surchargeInput: value });
    },
    [saveCurrentSession, setState],
  );

  const onOpenDiscountModal = useCallback(() => {
    setState((currentState) => ({ ...currentState, activeModal: "discount" }));
  }, [setState]);

  const onOpenSurchargeModal = useCallback(() => {
    setState((currentState) => ({ ...currentState, activeModal: "surcharge" }));
  }, [setState]);

  const onCloseAdjustmentModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "none",
      errorMessage: null,
    }));
  }, [setState]);

  const onApplyDiscount = useCallback(async () => {
    const result = await applyDiscountUseCase.execute({
      amount: parseAmountInput(state.discountInput),
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
      totals: result.value,
      activeModal: "none",
    }));
    await saveCurrentSession();
  }, [applyDiscountUseCase, saveCurrentSession, setState, state.discountInput]);

  const onApplySurcharge = useCallback(async () => {
    const result = await applySurchargeUseCase.execute({
      amount: parseAmountInput(state.surchargeInput),
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
      totals: result.value,
      activeModal: "none",
    }));
    await saveCurrentSession();
  }, [applySurchargeUseCase, saveCurrentSession, setState, state.surchargeInput]);

  const onClearCart = useCallback(async () => {
    const result = await clearCartUseCase.execute();
    if (!result.success) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: result.error.message,
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      cartLines: [],
      totals: EMPTY_TOTALS,
      activeModal: "none",
      discountInput: "",
      surchargeInput: "",
      paymentInput: "",
      filteredProducts: [],
      infoMessage: null,
      errorMessage: null,
      quickProductNameInput: "",
      quickProductPriceInput: "0",
      quickProductCategoryInput: "",
    }));

    if (activeBusinessAccountRemoteId) {
      await clearPosSessionUseCase.execute({
        businessAccountRemoteId: activeBusinessAccountRemoteId,
      });
    }
  }, [
    activeBusinessAccountRemoteId,
    clearCartUseCase,
    clearPosSessionUseCase,
    setState,
  ]);

  return useMemo(
    () => ({
      cartLines: state.cartLines,
      totals: state.totals,
      discountInput: state.discountInput,
      surchargeInput: state.surchargeInput,
      isDiscountModalVisible: state.activeModal === "discount",
      isSurchargeModalVisible: state.activeModal === "surcharge",
      onIncreaseQuantity,
      onDecreaseQuantity,
      onRemoveCartLine,
      onDiscountInputChange,
      onSurchargeInputChange,
      onOpenDiscountModal,
      onOpenSurchargeModal,
      onCloseAdjustmentModal,
      onApplyDiscount,
      onApplySurcharge,
      onClearCart,
    }),
    [
      onApplyDiscount,
      onApplySurcharge,
      onClearCart,
      onCloseAdjustmentModal,
      onDecreaseQuantity,
      onDiscountInputChange,
      onIncreaseQuantity,
      onOpenDiscountModal,
      onOpenSurchargeModal,
      onRemoveCartLine,
      onSurchargeInputChange,
      state.activeModal,
      state.cartLines,
      state.discountInput,
      state.surchargeInput,
      state.totals,
    ],
  );
}
