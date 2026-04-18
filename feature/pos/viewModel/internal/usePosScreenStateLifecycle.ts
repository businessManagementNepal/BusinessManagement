import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import { Status } from "@/shared/types/status.types";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PosScreenCoordinatorState } from "../../types/pos.state.types";
import type { PosMoneyAccountOption } from "../../types/pos.ui.types";
import { GetPosBootstrapUseCase } from "../../useCase/getPosBootstrap.useCase";
import { LoadPosSessionUseCase } from "../../useCase/loadPosSession.useCase";
import { SavePosSessionUseCase } from "../../useCase/savePosSession.useCase";
import { SearchPosProductsUseCase } from "../../useCase/searchPosProducts.useCase";
import {
  buildPosSessionDataFromState,
  buildPosSessionRestoreSnapshot,
  calculateTotals,
  EMPTY_POS_SESSION_RESTORE_SNAPSHOT,
  EMPTY_TOTALS,
  INITIAL_POS_SCREEN_COORDINATOR_STATE,
  mapMoneyAccountToOption,
  parseAmountInput,
  resolveSelectedSettlementAccountRemoteId,
  sanitizeSplitBillDraftPartSettlementAccounts,
  type PosSessionStateOverrides,
} from "./posScreen.shared";

interface UsePosScreenStateLifecycleParams {
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  activeSettlementAccountRemoteId: string | null;
  getPosBootstrapUseCase: GetPosBootstrapUseCase;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  searchPosProductsUseCase: SearchPosProductsUseCase;
  savePosSessionUseCase: SavePosSessionUseCase;
  loadPosSessionUseCase: LoadPosSessionUseCase;
}

interface PosScreenStateLifecycle {
  state: PosScreenCoordinatorState;
  setState: Dispatch<SetStateAction<PosScreenCoordinatorState>>;
  load: () => Promise<void>;
  saveCurrentSession: (
    overrides?: PosSessionStateOverrides,
  ) => Promise<void>;
}

export function usePosScreenStateLifecycle({
  activeBusinessAccountRemoteId,
  activeOwnerUserRemoteId,
  activeSettlementAccountRemoteId,
  getPosBootstrapUseCase,
  getMoneyAccountsUseCase,
  searchPosProductsUseCase,
  savePosSessionUseCase,
  loadPosSessionUseCase,
}: UsePosScreenStateLifecycleParams): PosScreenStateLifecycle {
  const [state, setState] = useState<PosScreenCoordinatorState>(
    INITIAL_POS_SCREEN_COORDINATOR_STATE,
  );
  const stateRef = useRef<PosScreenCoordinatorState>(
    INITIAL_POS_SCREEN_COORDINATOR_STATE,
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const saveCurrentSession = useCallback(
    async (overrides: PosSessionStateOverrides = {}) => {
      if (!activeBusinessAccountRemoteId) {
        return;
      }

      await savePosSessionUseCase.execute({
        businessAccountRemoteId: activeBusinessAccountRemoteId,
        sessionData: buildPosSessionDataFromState(stateRef.current, overrides),
      });
    },
    [activeBusinessAccountRemoteId, savePosSessionUseCase],
  );

  const load = useCallback(async () => {
    setState((currentState) => ({
      ...currentState,
      status: Status.Loading,
      errorMessage: null,
      infoMessage: null,
    }));

    const result = await getPosBootstrapUseCase.execute({
      activeBusinessAccountRemoteId,
      activeOwnerUserRemoteId,
      activeSettlementAccountRemoteId,
    });
    if (!result.success) {
      setState((currentState) => ({
        ...currentState,
        status: Status.Failure,
        bootstrap: null,
        cartLines: [],
        totals: EMPTY_TOTALS,
        errorMessage: result.error.message,
      }));
      return;
    }

    let moneyAccountOptions: PosMoneyAccountOption[] = [];
    if (activeBusinessAccountRemoteId) {
      const moneyAccountsResult = await getMoneyAccountsUseCase.execute(
        activeBusinessAccountRemoteId,
      );
      if (moneyAccountsResult.success) {
        moneyAccountOptions = moneyAccountsResult.value.map(mapMoneyAccountToOption);
      }
    }

    let sessionSnapshot = EMPTY_POS_SESSION_RESTORE_SNAPSHOT;

    if (activeBusinessAccountRemoteId) {
      const sessionResult = await loadPosSessionUseCase.execute({
        businessAccountRemoteId: activeBusinessAccountRemoteId,
      });

      if (sessionResult.success && sessionResult.value) {
        sessionSnapshot = buildPosSessionRestoreSnapshot(sessionResult.value);
      }
    }

    const selectedSettlementAccountRemoteId = resolveSelectedSettlementAccountRemoteId({
      moneyAccountOptions,
      sessionSelectedSettlementAccountRemoteId:
        sessionSnapshot.selectedSettlementAccountRemoteId,
      activeSettlementAccountRemoteId,
    });

    const sanitizedSplitBillDraftParts = sanitizeSplitBillDraftPartSettlementAccounts({
      splitBillDraftParts: sessionSnapshot.splitBillDraftParts,
      moneyAccountOptions,
      fallbackSettlementAccountRemoteId: selectedSettlementAccountRemoteId,
    });

    const restoredFilteredProducts =
      sessionSnapshot.didRestoreSession &&
      sessionSnapshot.productSearchTerm.trim().length > 0
        ? await searchPosProductsUseCase.execute(sessionSnapshot.productSearchTerm)
        : [];

    const restoredTotals = sessionSnapshot.didRestoreSession
      ? calculateTotals(
          sessionSnapshot.cartLines,
          parseAmountInput(sessionSnapshot.discountInput),
          parseAmountInput(sessionSnapshot.surchargeInput),
        )
      : EMPTY_TOTALS;

    setState((currentState) => ({
      ...currentState,
      status: Status.Success,
      bootstrap: result.value,
      products: result.value.products,
      filteredProducts: restoredFilteredProducts,
      cartLines: sessionSnapshot.didRestoreSession ? sessionSnapshot.cartLines : [],
      recentProducts: sessionSnapshot.didRestoreSession
        ? sessionSnapshot.recentProducts
        : [],
      productSearchTerm: sessionSnapshot.didRestoreSession
        ? sessionSnapshot.productSearchTerm
        : "",
      selectedCustomer: sessionSnapshot.didRestoreSession
        ? sessionSnapshot.selectedCustomer
        : null,
      selectedSettlementAccountRemoteId,
      moneyAccountOptions,
      discountInput: sessionSnapshot.didRestoreSession
        ? sessionSnapshot.discountInput
        : "",
      surchargeInput: sessionSnapshot.didRestoreSession
        ? sessionSnapshot.surchargeInput
        : "",
      splitBillDraftParts: sessionSnapshot.didRestoreSession
        ? sanitizedSplitBillDraftParts
        : [],
      totals: restoredTotals,
      errorMessage: null,
    }));
  }, [
    activeBusinessAccountRemoteId,
    activeOwnerUserRemoteId,
    activeSettlementAccountRemoteId,
    getMoneyAccountsUseCase,
    getPosBootstrapUseCase,
    loadPosSessionUseCase,
    searchPosProductsUseCase,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    state,
    setState,
    load,
    saveCurrentSession,
  };
}
