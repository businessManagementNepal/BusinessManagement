import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import type { GetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase";
import type { GetOrCreateBusinessContactUseCase } from "@/feature/contacts/useCase/getOrCreateBusinessContact.useCase";
import { SaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase";
import { TaxModeValue } from "@/shared/types/regionalFinance.types";
import { Status } from "@/shared/types/status.types";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";
import {
  buildTaxRateLabel,
  buildTaxSummaryLabel,
  resolveRegionalFinancePolicy,
} from "@/shared/utils/finance/regionalFinancePolicy";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { POS_SCREEN_TITLE } from "../types/pos.constant";
import type { PosPaymentPartInput } from "../types/pos.dto.types";
import type { PosReceipt } from "../types/pos.entity.types";
import type { PosScreenCoordinatorState } from "../types/pos.state.types";
import type {
  PosCheckoutMode,
  PosCheckoutSubmissionKind,
} from "../types/pos.workflow.types";
import { AddProductToCartUseCase } from "../useCase/addProductToCart.useCase";
import { ApplyDiscountUseCase } from "../useCase/applyDiscount.useCase";
import { ApplySurchargeUseCase } from "../useCase/applySurcharge.useCase";
import { ChangeCartLineQuantityUseCase } from "../useCase/changeCartLineQuantity.useCase";
import { ClearCartUseCase } from "../useCase/clearCart.useCase";
import { ClearPosSessionUseCase } from "../useCase/clearPosSession.useCase";
import { CompletePosCheckoutUseCase } from "../useCase/completePosCheckout.useCase";
import { GetPosBootstrapUseCase } from "../useCase/getPosBootstrap.useCase";
import { LoadPosSessionUseCase } from "../useCase/loadPosSession.useCase";
import { PrintPosReceiptUseCase } from "../useCase/printPosReceipt.useCase";
import { SavePosSessionUseCase } from "../useCase/savePosSession.useCase";
import { SearchPosProductsUseCase } from "../useCase/searchPosProducts.useCase";
import { SharePosReceiptUseCase } from "../useCase/sharePosReceipt.useCase";
import { usePosCartViewModel } from "./posCart.viewModel.impl";
import { usePosCatalogViewModel } from "./posCatalog.viewModel.impl";
import { usePosCheckoutViewModel } from "./posCheckout.viewModel.impl";
import { usePosCustomerViewModel } from "./posCustomer.viewModel.impl";
import {
  calculateTotals,
  EMPTY_TOTALS,
  INITIAL_POS_SCREEN_COORDINATOR_STATE,
  mapMoneyAccountToOption,
  parseAmountInput,
  type PosSessionStateOverrides,
} from "./internal/posScreen.shared";
import { usePosReceiptViewModel } from "./posReceipt.viewModel.impl";
import type { PosSaleHistoryViewModel } from "./posSaleHistory.viewModel";
import type { PosScreenCoordinatorViewModel } from "./posScreenCoordinator.viewModel";
import { usePosSplitBillViewModel } from "./posSplitBill.viewModel.impl";

interface UsePosScreenCoordinatorViewModelParams {
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  activeSettlementAccountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  activeAccountDefaultTaxRatePercent: number | null;
  activeAccountDefaultTaxMode: TaxModeValue | null;
  getPosBootstrapUseCase: GetPosBootstrapUseCase;
  searchPosProductsUseCase: SearchPosProductsUseCase;
  addProductToCartUseCase: AddProductToCartUseCase;
  changeCartLineQuantityUseCase: ChangeCartLineQuantityUseCase;
  applyDiscountUseCase: ApplyDiscountUseCase;
  applySurchargeUseCase: ApplySurchargeUseCase;
  getOrCreateBusinessContactUseCase: GetOrCreateBusinessContactUseCase;
  getContactsUseCase: GetContactsUseCase;
  clearCartUseCase: ClearCartUseCase;
  completePosCheckoutUseCase: CompletePosCheckoutUseCase;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  printPosReceiptUseCase: PrintPosReceiptUseCase;
  sharePosReceiptUseCase: SharePosReceiptUseCase;
  saveProductUseCase: SaveProductUseCase;
  savePosSessionUseCase: SavePosSessionUseCase;
  loadPosSessionUseCase: LoadPosSessionUseCase;
  clearPosSessionUseCase: ClearPosSessionUseCase;
  saleHistoryViewModel?: PosSaleHistoryViewModel | null;
}

export function usePosScreenCoordinatorViewModel(
  params: UsePosScreenCoordinatorViewModelParams,
): PosScreenCoordinatorViewModel {
  const {
    activeBusinessAccountRemoteId,
    activeOwnerUserRemoteId,
    activeSettlementAccountRemoteId,
    activeAccountCurrencyCode,
    activeAccountCountryCode,
    activeAccountDefaultTaxRatePercent,
    activeAccountDefaultTaxMode,
    getPosBootstrapUseCase,
    searchPosProductsUseCase,
    addProductToCartUseCase,
    changeCartLineQuantityUseCase,
    applyDiscountUseCase,
    applySurchargeUseCase,
    getOrCreateBusinessContactUseCase,
    getContactsUseCase,
    clearCartUseCase,
    completePosCheckoutUseCase,
    getMoneyAccountsUseCase,
    printPosReceiptUseCase,
    sharePosReceiptUseCase,
    saveProductUseCase,
    savePosSessionUseCase,
    loadPosSessionUseCase,
    clearPosSessionUseCase,
    saleHistoryViewModel = null,
  } = params;

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
  const defaultTaxRateLabel = useMemo(
    () => buildTaxRateLabel(regionalFinancePolicy.defaultTaxRatePercent),
    [regionalFinancePolicy.defaultTaxRatePercent],
  );
  const taxSummaryLabel = useMemo(
    () =>
      buildTaxSummaryLabel({
        taxLabel: regionalFinancePolicy.taxLabel,
        taxRatePercent: regionalFinancePolicy.defaultTaxRatePercent,
      }),
    [
      regionalFinancePolicy.defaultTaxRatePercent,
      regionalFinancePolicy.taxLabel,
    ],
  );
  const currencyCode = useMemo(
    () => regionalFinancePolicy.currencyCode,
    [regionalFinancePolicy.currencyCode],
  );

  const [state, setState] = useState<PosScreenCoordinatorState>(
    INITIAL_POS_SCREEN_COORDINATOR_STATE,
  );
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
    [],
  );

  const endCheckoutSubmission = useCallback(() => {
    checkoutSubmissionRef.current = null;
    setState((currentState) => ({
      ...currentState,
      isCheckoutSubmitting: false,
      checkoutSubmissionKind: null,
    }));
  }, []);

  const runCheckoutSubmission = useCallback(
    async (
      kind: PosCheckoutSubmissionKind,
      operation: () => Promise<boolean>,
    ): Promise<boolean> => {
      if (!beginCheckoutSubmission(kind)) {
        return false;
      }

      try {
        return await operation();
      } finally {
        endCheckoutSubmission();
      }
    },
    [beginCheckoutSubmission, endCheckoutSubmission],
  );

  const saveCurrentSession = useCallback(
    async (overrides: PosSessionStateOverrides = {}) => {
      if (!activeBusinessAccountRemoteId) {
        return;
      }

      await savePosSessionUseCase.execute({
        businessAccountRemoteId: activeBusinessAccountRemoteId,
        sessionData: {
          cartLines: overrides.cartLines ?? state.cartLines,
          recentProducts: overrides.recentProducts ?? state.recentProducts,
          productSearchTerm:
            overrides.productSearchTerm ?? state.productSearchTerm,
          selectedCustomer:
            overrides.selectedCustomer ?? state.selectedCustomer,
          selectedSettlementAccountRemoteId:
            overrides.selectedSettlementAccountRemoteId ??
            state.selectedSettlementAccountRemoteId,
          discountInput: overrides.discountInput ?? state.discountInput,
          surchargeInput: overrides.surchargeInput ?? state.surchargeInput,
          splitBillDraftParts:
            overrides.splitBillDraftParts ?? state.splitBillDraftParts,
        },
      });
    },
    [
      activeBusinessAccountRemoteId,
      savePosSessionUseCase,
      state.cartLines,
      state.discountInput,
      state.productSearchTerm,
      state.recentProducts,
      state.selectedCustomer,
      state.selectedSettlementAccountRemoteId,
      state.splitBillDraftParts,
      state.surchargeInput,
    ],
  );

  const recalculateTotals = useCallback((cartLines: readonly import("../types/pos.entity.types").PosCartLine[]) => {
    setState((currentState) => ({
      ...currentState,
      cartLines,
      totals: calculateTotals(
        cartLines,
        parseAmountInput(currentState.discountInput),
        parseAmountInput(currentState.surchargeInput),
      ),
    }));
  }, []);

  const finalizeSuccessfulCheckout = useCallback(
    async (receipt: PosReceipt) => {
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
        quickProductPriceInput: "0",
        quickProductCategoryInput: "",
        splitBillDraftParts: [],
        splitBillErrorMessage: null,
        infoMessage:
          receipt.ledgerEffect.type === "due_balance_created"
            ? `Sale completed. ${formatCurrencyAmount({
                amount: receipt.dueAmount,
                currencyCode,
                countryCode: regionalFinancePolicy.countryCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} was posted as ledger due.`
            : receipt.ledgerEffect.type === "due_balance_create_failed"
              ? `Sale completed. ${formatCurrencyAmount({
                  amount: receipt.dueAmount,
                  currencyCode,
                  countryCode: regionalFinancePolicy.countryCode,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} due could not be posted automatically. Add it from Ledger.`
              : receipt.ledgerEffect.type === "posting_sync_failed"
                ? "Sale completed, but accounting sync failed. Please review Ledger/Billing."
                : "Sale completed successfully.",
        errorMessage: null,
      }));

      if (activeBusinessAccountRemoteId) {
        await clearPosSessionUseCase.execute({
          businessAccountRemoteId: activeBusinessAccountRemoteId,
        });
      }
    },
    [
      activeBusinessAccountRemoteId,
      clearPosSessionUseCase,
      currencyCode,
      regionalFinancePolicy.countryCode,
    ],
  );

  const submitCheckout = useCallback(
    async (
      mode: PosCheckoutMode,
      paymentParts: readonly PosPaymentPartInput[],
    ): Promise<boolean> => {
      const result = await completePosCheckoutUseCase.execute({
        paymentParts,
        selectedCustomer: state.selectedCustomer,
        grandTotalSnapshot: state.totals.grandTotal,
        cartLinesSnapshot: state.cartLines,
        totalsSnapshot: state.totals,
        activeBusinessAccountRemoteId,
        activeOwnerUserRemoteId,
        activeAccountCurrencyCode: regionalFinancePolicy.currencyCode,
        activeAccountCountryCode: regionalFinancePolicy.countryCode,
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

      await finalizeSuccessfulCheckout(result.value);
      return true;
    },
    [
      activeBusinessAccountRemoteId,
      activeOwnerUserRemoteId,
      completePosCheckoutUseCase,
      finalizeSuccessfulCheckout,
      regionalFinancePolicy.countryCode,
      regionalFinancePolicy.currencyCode,
      state.cartLines,
      state.selectedCustomer,
      state.totals,
    ],
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

    let moneyAccountOptions: import("../types/pos.ui.types").PosMoneyAccountOption[] = [];
    if (activeBusinessAccountRemoteId) {
      const moneyAccountsResult = await getMoneyAccountsUseCase.execute(
        activeBusinessAccountRemoteId,
      );
      if (moneyAccountsResult.success) {
        moneyAccountOptions = moneyAccountsResult.value.map(
          mapMoneyAccountToOption,
        );
      }
    }

    let sessionDataSelectedCustomer = null as
      | null
      | typeof state.selectedCustomer;
    let sessionDataCartLines = [] as readonly import("../types/pos.entity.types").PosCartLine[];
    let sessionDataRecentProducts =
      [] as readonly import("../types/pos.entity.types").PosProduct[];
    let sessionDataProductSearchTerm = "";
    let sessionDataDiscountInput = "";
    let sessionDataSurchargeInput = "";
    let sessionDataSettlementAccountRemoteId = "";
    let sessionDataSplitBillDraftParts =
      [] as readonly import("../types/pos.entity.types").PosSplitDraftPart[];
    let didRestoreSession = false;

    if (activeBusinessAccountRemoteId) {
      const sessionResult = await loadPosSessionUseCase.execute({
        businessAccountRemoteId: activeBusinessAccountRemoteId,
      });

      if (sessionResult.success && sessionResult.value) {
        const sessionData = sessionResult.value;
        sessionDataCartLines = sessionData.cartLines;
        sessionDataRecentProducts = sessionData.recentProducts;
        sessionDataProductSearchTerm = sessionData.productSearchTerm;
        sessionDataSelectedCustomer = sessionData.selectedCustomer;
        sessionDataDiscountInput = sessionData.discountInput;
        sessionDataSurchargeInput = sessionData.surchargeInput;
        sessionDataSettlementAccountRemoteId =
          sessionData.selectedSettlementAccountRemoteId?.trim() ?? "";
        sessionDataSplitBillDraftParts = sessionData.splitBillDraftParts ?? [];
        didRestoreSession = true;
      }
    }

    const validSessionSettlementAccountRemoteId =
      sessionDataSettlementAccountRemoteId &&
      moneyAccountOptions.some(
        (option) => option.value === sessionDataSettlementAccountRemoteId,
      )
        ? sessionDataSettlementAccountRemoteId
        : "";
    const defaultSettlementAccountRemoteId =
      validSessionSettlementAccountRemoteId ||
      (activeSettlementAccountRemoteId?.trim() &&
      moneyAccountOptions.some(
        (option) => option.value === activeSettlementAccountRemoteId.trim(),
      )
        ? activeSettlementAccountRemoteId.trim()
        : "");

    const sanitizedSplitBillDraftParts = sessionDataSplitBillDraftParts.map(
      (part) => ({
        ...part,
        settlementAccountRemoteId: moneyAccountOptions.some(
          (option) => option.value === part.settlementAccountRemoteId,
        )
          ? part.settlementAccountRemoteId
          : defaultSettlementAccountRemoteId,
      }),
    );

    const restoredFilteredProducts =
      didRestoreSession && sessionDataProductSearchTerm.trim().length > 0
        ? await searchPosProductsUseCase.execute(sessionDataProductSearchTerm)
        : [];

    setState((currentState) => ({
      ...currentState,
      status: Status.Success,
      bootstrap: result.value,
      products: result.value.products,
      filteredProducts: restoredFilteredProducts,
      cartLines: didRestoreSession ? sessionDataCartLines : [],
      recentProducts: didRestoreSession ? sessionDataRecentProducts : [],
      productSearchTerm: didRestoreSession ? sessionDataProductSearchTerm : "",
      selectedCustomer: didRestoreSession ? sessionDataSelectedCustomer : null,
      selectedSettlementAccountRemoteId: defaultSettlementAccountRemoteId,
      moneyAccountOptions,
      discountInput: didRestoreSession ? sessionDataDiscountInput : "",
      surchargeInput: didRestoreSession ? sessionDataSurchargeInput : "",
      splitBillDraftParts: didRestoreSession
        ? sanitizedSplitBillDraftParts
        : [],
      totals: EMPTY_TOTALS,
      errorMessage: null,
    }));

    if (didRestoreSession) {
      const restoredTotals = calculateTotals(
        sessionDataCartLines,
        parseAmountInput(sessionDataDiscountInput),
        parseAmountInput(sessionDataSurchargeInput),
      );
      setState((currentState) => ({
        ...currentState,
        totals: restoredTotals,
      }));
    }
  }, [
    activeBusinessAccountRemoteId,
    activeOwnerUserRemoteId,
    activeSettlementAccountRemoteId,
    getMoneyAccountsUseCase,
    getPosBootstrapUseCase,
    loadPosSessionUseCase,
    searchPosProductsUseCase,
    state.selectedCustomer,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const catalog = usePosCatalogViewModel({
    state,
    setState,
    activeBusinessAccountRemoteId,
    defaultTaxRateLabel,
    searchPosProductsUseCase,
    addProductToCartUseCase,
    saveProductUseCase,
    saveCurrentSession,
  });

  const cart = usePosCartViewModel({
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
  });

  const customer = usePosCustomerViewModel({
    state,
    setState,
    activeBusinessAccountRemoteId,
    activeOwnerUserRemoteId,
    getContactsUseCase,
    getOrCreateBusinessContactUseCase,
    saveCurrentSession,
  });

  const checkout = usePosCheckoutViewModel({
    state,
    setState,
    saveCurrentSession,
    runCheckoutSubmission,
    submitCheckout,
  });

  const splitBill = usePosSplitBillViewModel({
    state,
    setState,
    saveCurrentSession,
    runCheckoutSubmission,
    submitCheckout,
  });

  const receipt = usePosReceiptViewModel({
    state,
    setState,
    currencyCode,
    countryCode: regionalFinancePolicy.countryCode,
    printPosReceiptUseCase,
    sharePosReceiptUseCase,
  });

  return useMemo(
    () => ({
      status: state.status,
      screenTitle: POS_SCREEN_TITLE,
      currencyCode,
      countryCode: regionalFinancePolicy.countryCode,
      taxSummaryLabel,
      infoMessage: state.infoMessage,
      errorMessage: state.errorMessage,
      isBusinessContextResolved:
        Boolean(activeBusinessAccountRemoteId) &&
        Boolean(activeOwnerUserRemoteId) &&
        Boolean(activeSettlementAccountRemoteId),
      isCheckoutSubmitting: state.isCheckoutSubmitting,
      load,
      catalog,
      cart,
      customer,
      checkout,
      splitBill,
      receipt,
      saleHistory: saleHistoryViewModel,
    }),
    [
      activeBusinessAccountRemoteId,
      activeOwnerUserRemoteId,
      activeSettlementAccountRemoteId,
      cart,
      catalog,
      checkout,
      currencyCode,
      customer,
      load,
      receipt,
      regionalFinancePolicy.countryCode,
      saleHistoryViewModel,
      splitBill,
      state.errorMessage,
      state.infoMessage,
      state.isCheckoutSubmitting,
      state.status,
      taxSummaryLabel,
    ],
  );
}
