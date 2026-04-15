import {
  MoneyAccount,
  MoneyAccountTypeValue,
} from "@/feature/accounts/types/moneyAccount.types";
import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import type { Contact } from "@/feature/contacts/types/contact.types";
import { ContactType } from "@/feature/contacts/types/contact.types";
import type { GetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase";
import type { GetOrCreateBusinessContactUseCase } from "@/feature/contacts/useCase/getOrCreateBusinessContact.useCase";
import {
  ProductKind,
  ProductStatus,
} from "@/feature/products/types/product.types";
import { SaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase";
import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { TaxModeValue } from "@/shared/types/regionalFinance.types";
import { Status } from "@/shared/types/status.types";
import { formatCurrencyAmount } from "@/shared/utils/currency/accountCurrency";
import {
  buildTaxRateLabel,
  buildTaxSummaryLabel,
  resolveRegionalFinancePolicy,
} from "@/shared/utils/finance/regionalFinancePolicy";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PosPaymentPartInput } from "../types/pos.dto.types";
import {
  PosCartLine,
  PosCustomer,
  PosProduct,
  PosReceipt,
  PosSplitDraftPart,
  PosTotals,
} from "../types/pos.entity.types";
import {
  PosCheckoutMode,
  PosCheckoutSubmissionKind,
  PosScreenState,
  PosScreenViewModel,
} from "../types/pos.state.types";
import { AddProductToCartUseCase } from "../useCase/addProductToCart.useCase";
import { ApplyDiscountUseCase } from "../useCase/applyDiscount.useCase";
import { ApplySurchargeUseCase } from "../useCase/applySurcharge.useCase";
import { ChangeCartLineQuantityUseCase } from "../useCase/changeCartLineQuantity.useCase";
import { ClearCartUseCase } from "../useCase/clearCart.useCase";
import { ClearPosSessionUseCase } from "../useCase/clearPosSession.useCase";
import { CompletePosCheckoutUseCase } from "../useCase/completePosCheckout.useCase";
import { GetPosBootstrapUseCase } from "../useCase/getPosBootstrap.useCase";
import { LoadPosSessionUseCase } from "../useCase/loadPosSession.useCase";
import { PrintReceiptUseCase } from "../useCase/printReceipt.useCase";
import { SavePosSessionUseCase } from "../useCase/savePosSession.useCase";
import { SearchPosProductsUseCase } from "../useCase/searchPosProducts.useCase";
import { ShareReceiptUseCase } from "../useCase/shareReceipt.useCase";

const EMPTY_TOTALS: PosTotals = {
  itemCount: 0,
  gross: 0,
  discountAmount: 0,
  surchargeAmount: 0,
  taxAmount: 0,
  grandTotal: 0,
};

const INITIAL_STATE: PosScreenState = {
  status: Status.Idle,
  bootstrap: null,
  products: [],
  filteredProducts: [],
  recentProducts: [],
  cartLines: [],
  totals: EMPTY_TOTALS,
  activeModal: "none",
  productSearchTerm: "",
  discountInput: "",
  surchargeInput: "",
  paymentInput: "",
  quickProductNameInput: "",
  quickProductPriceInput: "0",
  quickProductCategoryInput: "",
  receipt: null,
  infoMessage: null,
  errorMessage: null,
  selectedCustomer: null,
  customerSearchTerm: "",
  customerOptions: [],
  selectedSettlementAccountRemoteId: "",
  moneyAccountOptions: [],
  customerCreateForm: {
    fullName: "",
    phone: "",
    address: "",
  },
  isCreatingCustomer: false,
  splitBillDraftParts: [],
  splitBillErrorMessage: null,
  isCheckoutSubmitting: false,
  checkoutSubmissionKind: null,
};

const calculateTotals = (
  cartLines: readonly PosCartLine[],
  discountAmount: number,
  surchargeAmount: number,
): PosTotals => {
  const gross = cartLines.reduce((sum, line) => sum + line.lineSubtotal, 0);
  const adjustedBase = Math.max(gross - discountAmount + surchargeAmount, 0);
  const weightedTaxRate =
    cartLines.length === 0
      ? 0
      : cartLines.reduce(
          (sum, line) => sum + line.taxRate * line.lineSubtotal,
          0,
        ) / Math.max(gross, 1);
  const taxAmount = Number((adjustedBase * weightedTaxRate).toFixed(2));
  const grandTotal = Number((adjustedBase + taxAmount).toFixed(2));

  return {
    itemCount: cartLines.reduce((sum, line) => sum + line.quantity, 0),
    gross: Number(gross.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    surchargeAmount: Number(surchargeAmount.toFixed(2)),
    taxAmount,
    grandTotal,
  };
};

const parseAmountInput = (value: string): number => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return 0;
  }

  const parsed = Number(normalizedValue);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
};

const buildNextRecentProducts = (
  currentRecentProducts: readonly PosProduct[],
  product: PosProduct,
): readonly PosProduct[] => {
  const filteredRecent = currentRecentProducts.filter(
    (item) => item.id !== product.id,
  );

  return [product, ...filteredRecent];
};

const buildEqualSplitDraftParts = (
  count: number,
  grandTotal: number,
  defaultSettlementAccountRemoteId: string,
): readonly PosSplitDraftPart[] => {
  const safeCount = Math.max(count, 2);
  const base = Number((grandTotal / safeCount).toFixed(2));

  const parts = Array.from({ length: safeCount }, (_, index) => ({
    paymentPartId: `part-${index + 1}`,
    payerLabel: `Friend ${index + 1}`,
    amountInput: base.toFixed(2),
    settlementAccountRemoteId: defaultSettlementAccountRemoteId,
  }));

  const allocated = parts.reduce(
    (sum, part) => sum + Number(part.amountInput || "0"),
    0,
  );
  const diff = Number((grandTotal - allocated).toFixed(2));

  if (diff !== 0 && parts.length > 0) {
    const last = parts[parts.length - 1];
    parts[parts.length - 1] = {
      ...last,
      amountInput: (Number(last.amountInput) + diff).toFixed(2),
    };
  }

  return parts;
};

const getSplitDraftSummary = (
  parts: readonly PosSplitDraftPart[],
  grandTotal: number,
) => {
  const allocatedAmount = parts.reduce(
    (sum, part) => sum + parseAmountInput(part.amountInput),
    0,
  );

  return {
    allocatedAmount: Number(allocatedAmount.toFixed(2)),
    remainingAmount: Number((grandTotal - allocatedAmount).toFixed(2)),
  };
};

const validateSplitBillDraft = (
  parts: readonly PosSplitDraftPart[],
  grandTotal: number,
  selectedCustomer: PosCustomer | null,
): string | null => {
  if (parts.length < 2) {
    return "Add at least two payment parts for split bill.";
  }

  let allocated = 0;

  for (const part of parts) {
    const amount = parseAmountInput(part.amountInput);

    if (amount <= 0) {
      return "Each split row must have an amount greater than zero.";
    }

    if (!part.settlementAccountRemoteId.trim()) {
      return "Each split row must have a settlement money account.";
    }

    allocated += amount;
  }

  const remaining = Number((grandTotal - allocated).toFixed(2));

  if (remaining < 0) {
    return "Split payment total cannot exceed grand total.";
  }

  if (remaining > 0 && !selectedCustomer) {
    return "Select a customer when split payment leaves a due amount.";
  }

  return null;
};

const getMoneyAccountTypeLabel = (type: MoneyAccountTypeValue): string =>
  type === "cash" ? "Cash" : type === "bank" ? "Bank" : "Wallet";

const mapMoneyAccountToOption = (
  moneyAccount: MoneyAccount,
): DropdownOption => {
  const typeLabel = getMoneyAccountTypeLabel(moneyAccount.type);
  const primarySuffix = moneyAccount.isPrimary ? " (Primary)" : "";

  return {
    label: `${moneyAccount.name} | ${typeLabel}${primarySuffix}`,
    value: moneyAccount.remoteId,
  };
};

export type UsePosScreenViewModelParams = {
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
  printReceiptUseCase: PrintReceiptUseCase;
  shareReceiptUseCase: ShareReceiptUseCase;
  saveProductUseCase: SaveProductUseCase;
  savePosSessionUseCase: SavePosSessionUseCase;
  loadPosSessionUseCase: LoadPosSessionUseCase;
  clearPosSessionUseCase: ClearPosSessionUseCase;
};

export function usePosScreenViewModel(
  params: UsePosScreenViewModelParams,
): PosScreenViewModel {
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
    printReceiptUseCase,
    saveProductUseCase,
    shareReceiptUseCase,
    savePosSessionUseCase,
    loadPosSessionUseCase,
    clearPosSessionUseCase,
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
  const [state, setState] = useState<PosScreenState>(INITIAL_STATE);
  const customerSearchRequestRef = useRef(0);

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

  const currencyCode = useMemo(
    () => regionalFinancePolicy.currencyCode,
    [regionalFinancePolicy.currencyCode],
  );

  const recentProducts = useMemo(() => {
    // For production-grade implementation, track recently used products
    // For now, use empty array until products are added/used
    return state.recentProducts;
  }, [state.recentProducts]);

  const splitBillSummary = useMemo(() => {
    return getSplitDraftSummary(
      state.splitBillDraftParts,
      state.totals.grandTotal,
    );
  }, [state.splitBillDraftParts, state.totals.grandTotal]);

  const updateRecentProducts = useCallback((product: PosProduct) => {
    let nextRecentProducts: readonly PosProduct[] = [];

    setState((currentState) => {
      nextRecentProducts = buildNextRecentProducts(
        currentState.recentProducts,
        product,
      );

      return {
        ...currentState,
        recentProducts: nextRecentProducts,
      };
    });

    return nextRecentProducts;
  }, []);

  const saveCurrentSession = useCallback(
    async (
      overrides: Partial<{
        cartLines: readonly PosCartLine[];
        recentProducts: readonly PosProduct[];
        productSearchTerm: string;
        selectedCustomer: typeof state.selectedCustomer;
        selectedSettlementAccountRemoteId: string;
        discountInput: string;
        surchargeInput: string;
        splitBillDraftParts: readonly PosSplitDraftPart[];
      }> = {},
    ) => {
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
      state.recentProducts,
      state.productSearchTerm,
      state.selectedSettlementAccountRemoteId,
      state.discountInput,
      state.surchargeInput,
      state.splitBillDraftParts,
    ],
  );

  const recalculateTotals = useCallback((cartLines: readonly PosCartLine[]) => {
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
    state.selectedSettlementAccountRemoteId,
    state.totals.grandTotal,
    state.selectedCustomer,
  ]);

  const buildPaymentCheckoutParts =
    useCallback((): readonly PosPaymentPartInput[] => {
      const paidAmount = parseAmountInput(state.paymentInput);
      const settlementAccountRemoteId =
        state.selectedSettlementAccountRemoteId.trim();

      return buildNormalPaymentParts(paidAmount, settlementAccountRemoteId);
    }, [state.paymentInput, state.selectedSettlementAccountRemoteId]);

  const validateCheckoutMode = useCallback(
    (mode: PosCheckoutMode): string | null => {
      if (mode === "payment") {
        return validatePaymentCheckout();
      }

      return validateSplitBillDraft(
        state.splitBillDraftParts,
        state.totals.grandTotal,
        state.selectedCustomer,
      );
    },
    [
      state.splitBillDraftParts,
      state.totals.grandTotal,
      state.selectedCustomer,
      validatePaymentCheckout,
    ],
  );

  const buildCheckoutPaymentParts = useCallback(
    (mode: PosCheckoutMode): readonly PosPaymentPartInput[] => {
      if (mode === "payment") {
        return buildPaymentCheckoutParts();
      }

      return state.splitBillDraftParts.map((part) => ({
        paymentPartId: part.paymentPartId,
        payerLabel: part.payerLabel.trim() || null,
        amount: parseAmountInput(part.amountInput),
        settlementAccountRemoteId: part.settlementAccountRemoteId,
      }));
    },
    [buildPaymentCheckoutParts, state.splitBillDraftParts],
  );

  const setCheckoutModeError = useCallback(
    (mode: PosCheckoutMode, message: string) => {
      setState((currentState) => ({
        ...currentState,
        errorMessage: mode === "payment" ? message : currentState.errorMessage,
        splitBillErrorMessage:
          mode === "split-bill" ? message : currentState.splitBillErrorMessage,
      }));
    },
    [],
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
      completePosCheckoutUseCase,
      state.selectedCustomer,
      state.totals.grandTotal,
      activeBusinessAccountRemoteId,
      activeOwnerUserRemoteId,
      regionalFinancePolicy.currencyCode,
      regionalFinancePolicy.countryCode,
      finalizeSuccessfulCheckout,
    ],
  );

  const runCheckoutFlow = useCallback(
    async (mode: PosCheckoutMode): Promise<boolean> => {
      const validationError = validateCheckoutMode(mode);

      if (validationError) {
        setCheckoutModeError(mode, validationError);
        return false;
      }

      const paymentParts = buildCheckoutPaymentParts(mode);

      return runCheckoutSubmission(
        mode === "payment" ? "payment" : "split-bill",
        async () => submitCheckout(mode, paymentParts),
      );
    },
    [
      validateCheckoutMode,
      setCheckoutModeError,
      buildCheckoutPaymentParts,
      runCheckoutSubmission,
      submitCheckout,
    ],
  );

  const onShareReceipt = useCallback(async () => {
    if (!state.receipt) {
      return;
    }
    const result = await shareReceiptUseCase.execute({
      receipt: state.receipt,
      currencyCode,
      countryCode: regionalFinancePolicy.countryCode,
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
  }, [
    shareReceiptUseCase,
    state.receipt,
    currencyCode,
    regionalFinancePolicy.countryCode,
  ]);

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
        slots: [],
        cartLines: [],
        totals: EMPTY_TOTALS,
        errorMessage: result.error.message,
      }));
      return;
    }

    let moneyAccountOptions: DropdownOption[] = [];
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
    let sessionDataCartLines: readonly PosCartLine[] = [];
    let sessionDataRecentProducts: readonly PosProduct[] = [];
    let sessionDataProductSearchTerm = "";
    let sessionDataDiscountInput = "";
    let sessionDataSurchargeInput = "";
    let sessionDataSettlementAccountRemoteId = "";
    let sessionDataSplitBillDraftParts: readonly PosSplitDraftPart[] = [];
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

    // Sanitize restored split draft parts - remove invalid settlement accounts
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

    const nextState = {
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
    };

    setState((currentState) => ({
      ...currentState,
      ...nextState,
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
    getPosBootstrapUseCase,
    getMoneyAccountsUseCase,
    loadPosSessionUseCase,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const onProductSearchChange = useCallback(
    async (value: string) => {
      const products = await searchPosProductsUseCase.execute(value);
      setState((currentState) => ({
        ...currentState,
        productSearchTerm: value,
        filteredProducts: products,
      }));

      await saveCurrentSession({
        productSearchTerm: value,
      });
    },
    [searchPosProductsUseCase, saveCurrentSession],
  );

  const onAddProductToCart = useCallback(
    async (productId: string) => {
      const product = state.products.find((p) => p.id === productId);
      if (!product) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: "Product not found.",
        }));
        return;
      }

      const result = await addProductToCartUseCase.execute({ productId });

      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: result.error.message,
        }));
        return;
      }

      const nextRecentProducts = buildNextRecentProducts(
        state.recentProducts,
        product,
      );

      recalculateTotals(result.value);

      setState((currentState) => ({
        ...currentState,
        cartLines: result.value,
        totals: calculateTotals(
          result.value,
          parseAmountInput(currentState.discountInput),
          parseAmountInput(currentState.surchargeInput),
        ),
        recentProducts: nextRecentProducts,
        errorMessage: null,
      }));

      await saveCurrentSession({
        cartLines: result.value,
        recentProducts: nextRecentProducts,
      });
    },
    [
      addProductToCartUseCase,
      calculateTotals,
      parseAmountInput,
      recalculateTotals,
      saveCurrentSession,
      state.products,
      state.recentProducts,
    ],
  );

  const onCloseModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "none",
      productSearchTerm: currentState.productSearchTerm,
      quickProductNameInput: "",
      quickProductPriceInput: "0",
      quickProductCategoryInput: "",
      errorMessage: null,
    }));
  }, []);

  const onOpenCreateProductModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "create-product",
      quickProductNameInput: "",
      quickProductPriceInput: "0",
      quickProductCategoryInput: "",
      errorMessage: null,
      infoMessage: null,
    }));
  }, []);

  const onCloseCreateProductModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "none",
      quickProductNameInput: "",
      quickProductPriceInput: "0",
      quickProductCategoryInput: "",
      errorMessage: null,
    }));
  }, []);

  const onQuickProductNameInputChange = useCallback((value: string) => {
    setState((currentState) => ({
      ...currentState,
      quickProductNameInput: value,
      errorMessage: null,
    }));
  }, []);

  const onQuickProductPriceInputChange = useCallback((value: string) => {
    setState((currentState) => ({
      ...currentState,
      quickProductPriceInput: value,
      errorMessage: null,
    }));
  }, []);

  const onQuickProductCategoryInputChange = useCallback((value: string) => {
    setState((currentState) => ({
      ...currentState,
      quickProductCategoryInput: value,
      errorMessage: null,
    }));
  }, []);

  const onCreateProductFromPos = useCallback(async () => {
    const normalizedName = state.quickProductNameInput.trim();
    const normalizedPrice = state.quickProductPriceInput.trim();
    const parsedPrice = parseAmountInput(normalizedPrice);

    if (!normalizedName) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Product name is required.",
      }));
      return;
    }

    if (parsedPrice < 0) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Enter a valid sale price (0 or higher).",
      }));
      return;
    }

    if (!activeBusinessAccountRemoteId) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Business context is required for product creation.",
      }));
      return;
    }

    const saveResult = await saveProductUseCase.execute({
      remoteId: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      accountRemoteId: activeBusinessAccountRemoteId,
      name: normalizedName,
      kind: ProductKind.Item,
      categoryName: state.quickProductCategoryInput.trim() || null,
      salePrice: parsedPrice,
      costPrice: null,
      stockQuantity: 0,
      unitLabel: "pcs",
      skuOrBarcode: null,
      taxRateLabel: defaultTaxRateLabel,
      description: null,
      imageUrl: null,
      status: ProductStatus.Active,
    });

    if (!saveResult.success) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: saveResult.error.message,
      }));
      return;
    }

    const addResult = await addProductToCartUseCase.execute({
      productId: saveResult.value.remoteId,
    });

    if (!addResult.success) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: addResult.error.message,
      }));
      return;
    }

    const refreshedProducts = await searchPosProductsUseCase.execute(
      state.productSearchTerm,
    );

    const createdProduct: PosProduct = {
      id: saveResult.value.remoteId,
      name: saveResult.value.name,
      categoryLabel: saveResult.value.categoryName ?? "General",
      unitLabel: saveResult.value.unitLabel ?? null,
      price: saveResult.value.salePrice,
      taxRate: 0,
      shortCode: saveResult.value.name.trim().slice(0, 1).toUpperCase() || "P",
    };

    const nextRecentProducts = buildNextRecentProducts(
      state.recentProducts,
      createdProduct,
    );

    recalculateTotals(addResult.value);

    setState((currentState) => ({
      ...currentState,
      activeModal: "none",
      quickProductNameInput: "",
      quickProductPriceInput: "0",
      quickProductCategoryInput: "",
      products: refreshedProducts,
      filteredProducts: refreshedProducts, // Keep filtered products tied to search term
      cartLines: addResult.value,
      totals: calculateTotals(
        addResult.value,
        parseAmountInput(currentState.discountInput),
        parseAmountInput(currentState.surchargeInput),
      ),
      recentProducts: nextRecentProducts,
      errorMessage: null,
      infoMessage: `Product "${normalizedName}" created and added to cart successfully.`,
    }));

    await saveCurrentSession({
      cartLines: addResult.value,
      recentProducts: nextRecentProducts,
    });
  }, [
    activeBusinessAccountRemoteId,
    addProductToCartUseCase,
    defaultTaxRateLabel,
    updateRecentProducts,
    recalculateTotals,
    saveProductUseCase,
    searchPosProductsUseCase,
    state.productSearchTerm,
    state.quickProductCategoryInput,
    state.quickProductNameInput,
    state.quickProductPriceInput,
  ]);

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

      await saveCurrentSession({
        cartLines: result.value,
      });
    },
    [
      changeCartLineQuantityUseCase,
      recalculateTotals,
      saveCurrentSession,
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

      await saveCurrentSession({
        cartLines: result.value,
      });
    },
    [
      changeCartLineQuantityUseCase,
      recalculateTotals,
      saveCurrentSession,
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

      await saveCurrentSession({
        cartLines: result.value,
      });
    },
    [changeCartLineQuantityUseCase, recalculateTotals, saveCurrentSession],
  );

  const onDiscountInputChange = useCallback(
    async (value: string) => {
      setState((currentState) => ({ ...currentState, discountInput: value }));

      await saveCurrentSession({
        discountInput: value,
      });
    },
    [saveCurrentSession],
  );

  const onSurchargeInputChange = useCallback(
    async (value: string) => {
      setState((currentState) => ({ ...currentState, surchargeInput: value }));

      await saveCurrentSession({
        surchargeInput: value,
      });
    },
    [saveCurrentSession],
  );

  const onPaymentInputChange = useCallback((value: string) => {
    setState((currentState) => ({ ...currentState, paymentInput: value }));
  }, []);

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
    [saveCurrentSession],
  );

  const onOpenDiscountModal = useCallback(() => {
    setState((currentState) => ({ ...currentState, activeModal: "discount" }));
  }, []);

  const onOpenSurchargeModal = useCallback(() => {
    setState((currentState) => ({ ...currentState, activeModal: "surcharge" }));
  }, []);

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
  }, []);

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

    // Save session after discount change
    await saveCurrentSession();
  }, [applyDiscountUseCase, state.discountInput, saveCurrentSession]);

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

    // Save session after surcharge change
    await saveCurrentSession();
  }, [applySurchargeUseCase, state.surchargeInput, saveCurrentSession]);

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
      filteredProducts: [], // Clear filtered products when clearing cart
      infoMessage: null,
      errorMessage: null,
      quickProductNameInput: "",
      quickProductPriceInput: "0",
      quickProductCategoryInput: "",
    }));

    // Clear session after clearing cart
    if (activeBusinessAccountRemoteId) {
      await clearPosSessionUseCase.execute({
        businessAccountRemoteId: activeBusinessAccountRemoteId,
      });
    }
  }, [
    clearCartUseCase,
    clearPosSessionUseCase,
    activeBusinessAccountRemoteId,
    searchPosProductsUseCase,
    state.totals.grandTotal,
    currencyCode,
    regionalFinancePolicy.countryCode,
    state.selectedCustomer,
  ]);

  const onConfirmPayment = useCallback(async () => {
    await runCheckoutFlow("payment");
  }, [runCheckoutFlow]);

  const onPrintReceipt = useCallback(async () => {
    if (!state.receipt) {
      return;
    }

    const result = await printReceiptUseCase.execute({
      receipt: state.receipt,
      currencyCode,
      countryCode: regionalFinancePolicy.countryCode,
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
  }, [printReceiptUseCase, state.receipt]);

  const onSelectCustomer = useCallback(
    async (customer: PosCustomer) => {
      setState((currentState) => ({
        ...currentState,
        selectedCustomer: customer,
        customerSearchTerm: "",
        customerOptions: [],
        errorMessage: null,
      }));

      await saveCurrentSession({
        selectedCustomer: customer,
      });
    },
    [saveCurrentSession],
  );

  const onClearCustomer = useCallback(async () => {
    customerSearchRequestRef.current += 1;
    setState((currentState) => ({
      ...currentState,
      selectedCustomer: null,
      customerSearchTerm: "",
      customerOptions: [],
      errorMessage: null,
    }));

    await saveCurrentSession({
      selectedCustomer: null,
    });
  }, [saveCurrentSession]);

  const onCustomerSearchChange = useCallback(
    async (value: string) => {
      const trimmedValue = value.trim();

      setState((currentState) => ({
        ...currentState,
        customerSearchTerm: value,
        errorMessage: null,
      }));

      if (!activeBusinessAccountRemoteId || trimmedValue === "") {
        customerSearchRequestRef.current += 1;
        setState((currentState) => ({
          ...currentState,
          customerOptions: [],
        }));
        return;
      }

      const requestId = ++customerSearchRequestRef.current;
      const searchTerm = trimmedValue.toLowerCase();

      try {
        const result = await getContactsUseCase.execute({
          accountRemoteId: activeBusinessAccountRemoteId,
        });

        if (requestId !== customerSearchRequestRef.current) {
          return;
        }

        if (!result.success) {
          setState((currentState) => ({
            ...currentState,
            customerOptions: [],
            errorMessage: result.error.message,
          }));
          return;
        }

        const customerOptions = result.value
          .filter(
            (contact: Contact) => contact.contactType === ContactType.Customer,
          )
          .filter((contact: Contact) => {
            const nameMatch = contact.fullName
              .toLowerCase()
              .includes(searchTerm);
            const phoneMatch =
              contact.phoneNumber?.toLowerCase().includes(searchTerm) ?? false;

            return nameMatch || phoneMatch;
          })
          .slice(0, 10)
          .map((contact: Contact) => ({
            label:
              contact.fullName +
              (contact.phoneNumber ? ` - ${contact.phoneNumber}` : ""),
            value: contact.remoteId,
            customerData: {
              remoteId: contact.remoteId,
              fullName: contact.fullName,
              phone: contact.phoneNumber,
              address: contact.address,
            },
          }));

        setState((currentState) => ({
          ...currentState,
          customerOptions,
        }));
      } catch (error) {
        if (requestId !== customerSearchRequestRef.current) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          customerOptions: [],
          errorMessage:
            error instanceof Error
              ? error.message
              : "Failed to search customers",
        }));
      }
    },
    [activeBusinessAccountRemoteId, getContactsUseCase],
  );

  const onOpenCustomerCreateModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "customer-create",
      customerCreateForm: {
        fullName: "",
        phone: "",
        address: "",
      },
    }));
  }, []);

  const onCreateCustomer = useCallback(async () => {
    const { fullName, phone, address } = state.customerCreateForm;

    // Validate form
    if (!fullName.trim()) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Customer name is required.",
      }));
      return;
    }

    if (!activeBusinessAccountRemoteId || !activeOwnerUserRemoteId) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Business context is required for customer creation.",
      }));
      return;
    }

    // Set creating state to true
    setState((currentState) => ({
      ...currentState,
      isCreatingCustomer: true,
      errorMessage: null,
    }));

    // Create customer
    const result = await getOrCreateBusinessContactUseCase.execute({
      accountRemoteId: activeBusinessAccountRemoteId,
      contactType: "customer",
      fullName: fullName.trim(),
      ownerUserRemoteId: activeOwnerUserRemoteId,
      phoneNumber: phone.trim() || null,
      address: address.trim() || null,
      notes: null,
    });

    if (!result.success) {
      setState((currentState) => ({
        ...currentState,
        isCreatingCustomer: false,
        errorMessage: result.error.message,
      }));
      return;
    }

    // Auto-select the newly created customer
    const newCustomer = {
      remoteId: result.value.remoteId,
      fullName: result.value.fullName,
      phone: result.value.phoneNumber,
      address: result.value.address,
    };

    setState((currentState) => ({
      ...currentState,
      selectedCustomer: newCustomer,
      activeModal: "none",
      customerCreateForm: {
        fullName: "",
        phone: "",
        address: "",
      },
      isCreatingCustomer: false,
      errorMessage: null,
      infoMessage: `Customer "${fullName}" created and selected successfully.`,
    }));

    await saveCurrentSession({
      selectedCustomer: newCustomer,
    });
  }, [
    getOrCreateBusinessContactUseCase,
    activeBusinessAccountRemoteId,
    activeOwnerUserRemoteId,
    state.customerCreateForm,
  ]);

  const onCloseCustomerCreateModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "none",
      customerCreateForm: {
        fullName: "",
        phone: "",
        address: "",
      },
    }));
  }, []);

  const onCustomerCreateFormChange = useCallback(
    (field: keyof typeof state.customerCreateForm, value: string) => {
      setState((currentState) => ({
        ...currentState,
        customerCreateForm: {
          ...currentState.customerCreateForm,
          [field]: value,
        },
      }));
    },
    [state],
  );

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
  }, []);

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
  }, []);

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
  }, []);

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
      buildEqualSplitDraftParts,
      state.totals.grandTotal,
      state.selectedSettlementAccountRemoteId,
      saveCurrentSession,
    ],
  );

  const onAddSplitBillPart = useCallback(async () => {
    const newPart: PosSplitDraftPart = {
      paymentPartId: `part-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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

    await saveCurrentSession({
      splitBillDraftParts: updatedParts,
    });
  }, [
    state.splitBillDraftParts.length,
    state.selectedSettlementAccountRemoteId,
    saveCurrentSession,
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

      await saveCurrentSession({
        splitBillDraftParts: updatedParts,
      });
    },
    [state.splitBillDraftParts, saveCurrentSession],
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

      await saveCurrentSession({
        splitBillDraftParts: updatedParts,
      });
    },
    [state.splitBillDraftParts, saveCurrentSession],
  );

  const onChangeSplitBillPartPayerLabel = useCallback(
    async (paymentPartId: string, value: string) => {
      const updatedParts = state.splitBillDraftParts.map((part) =>
        part.paymentPartId === paymentPartId
          ? { ...part, payerLabel: value }
          : part,
      );
      setState((currentState) => ({
        ...currentState,
        splitBillDraftParts: updatedParts,
        splitBillErrorMessage: null,
      }));

      await saveCurrentSession({
        splitBillDraftParts: updatedParts,
      });
    },
    [state.splitBillDraftParts, saveCurrentSession],
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

      await saveCurrentSession({
        splitBillDraftParts: updatedParts,
      });
    },
    [state.splitBillDraftParts, saveCurrentSession],
  );

  const onCompleteSplitBillPayment = useCallback(async () => {
    await runCheckoutFlow("split-bill");
  }, [runCheckoutFlow]);

  const onOpenReceiptModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "receipt",
    }));
  }, []);

  const onCloseReceiptModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "none",
    }));
  }, []);

  return useMemo<PosScreenViewModel>(
    () => ({
      status: state.status,
      screenTitle: "POS Checkout",
      currencyCode,
      countryCode: regionalFinancePolicy.countryCode,
      taxSummaryLabel,
      cartLines: state.cartLines,
      totals: state.totals,
      products: state.filteredProducts, // Only show filtered products, never all products
      filteredProducts: state.filteredProducts,
      recentProducts,
      activeModal: state.activeModal,
      productSearchTerm: state.productSearchTerm,
      discountInput: state.discountInput,
      surchargeInput: state.surchargeInput,
      paymentInput: state.paymentInput,
      quickProductNameInput: state.quickProductNameInput,
      quickProductPriceInput: state.quickProductPriceInput,
      quickProductCategoryInput: state.quickProductCategoryInput,
      receipt: state.receipt,
      infoMessage: state.infoMessage,
      errorMessage: state.errorMessage,
      selectedCustomer: state.selectedCustomer,
      customerSearchTerm: state.customerSearchTerm,
      customerCreateForm: state.customerCreateForm,
      isBusinessContextResolved:
        Boolean(activeBusinessAccountRemoteId) &&
        Boolean(activeOwnerUserRemoteId) &&
        Boolean(activeSettlementAccountRemoteId),
      load,
      onProductSearchChange,
      onAddProductToCart,
      onOpenCreateProductModal,
      onCloseCreateProductModal,
      onQuickProductNameInputChange,
      onQuickProductPriceInputChange,
      onQuickProductCategoryInputChange,
      onCreateProductFromPos,
      onCloseModal,
      onIncreaseQuantity,
      onDecreaseQuantity,
      onRemoveCartLine,
      onDiscountInputChange,
      onSurchargeInputChange,
      onPaymentInputChange,
      onOpenDiscountModal,
      onOpenSurchargeModal,
      onOpenPaymentModal,
      onClosePaymentModal,
      onConfirmPayment,
      onOpenSplitBillModal,
      onCloseSplitBillModal,
      onApplyEqualSplit,
      onAddSplitBillPart,
      onRemoveSplitBillPart,
      onChangeSplitBillPartAmount,
      onChangeSplitBillPartPayerLabel,
      onChangeSplitBillPartSettlementAccount,
      onCompleteSplitBillPayment,
      onOpenReceiptModal,
      onCloseReceiptModal,
      onPrintReceipt,
      onShareReceipt,
      onSelectCustomer,
      onClearCustomer,
      onCustomerSearchChange,
      onOpenCustomerCreateModal,
      onCloseCustomerCreateModal,
      onCustomerCreateFormChange,
      onCreateCustomer,
      onSettlementAccountChange,
      onApplyDiscount,
      onApplySurcharge,
      onClearCart,
      customerOptions: state.customerOptions,
      moneyAccountOptions: state.moneyAccountOptions,
      selectedSettlementAccountRemoteId:
        state.selectedSettlementAccountRemoteId,
      isCreatingCustomer: state.isCreatingCustomer,
      splitBillDraftParts: state.splitBillDraftParts,
      splitBillAllocatedAmount: splitBillSummary.allocatedAmount,
      splitBillRemainingAmount: splitBillSummary.remainingAmount,
      splitBillErrorMessage: state.splitBillErrorMessage || null,
      isCheckoutSubmitting: state.isCheckoutSubmitting,
      isPaymentSubmitting:
        state.isCheckoutSubmitting &&
        state.checkoutSubmissionKind === "payment",
      isSplitBillSubmitting:
        state.isCheckoutSubmitting &&
        state.checkoutSubmissionKind === "split-bill",
    }),
    [
      activeBusinessAccountRemoteId,
      activeOwnerUserRemoteId,
      activeSettlementAccountRemoteId,
      currencyCode,
      load,
      onApplyDiscount,
      onApplySurcharge,
      onClearCart,
      onCloseModal,
      onCreateProductFromPos,
      onDecreaseQuantity,
      onDiscountInputChange,
      onIncreaseQuantity,
      onOpenDiscountModal,
      onOpenPaymentModal,
      onOpenSplitBillModal,
      onOpenSurchargeModal,
      onPaymentInputChange,
      onPrintReceipt,
      onShareReceipt,
      onProductSearchChange,
      onOpenCreateProductModal,
      onCloseCreateProductModal,
      onQuickProductNameInputChange,
      onQuickProductPriceInputChange,
      onQuickProductCategoryInputChange,
      onRemoveCartLine,
      onAddProductToCart,
      state.customerCreateForm,
      state.customerSearchTerm,
      state.selectedCustomer,
      state.activeModal,
      state.cartLines,
      state.discountInput,
      state.errorMessage,
      state.filteredProducts,
      state.infoMessage,
      state.paymentInput,
      state.productSearchTerm,
      state.products,
      state.quickProductCategoryInput,
      state.quickProductNameInput,
      state.quickProductPriceInput,
      state.receipt,
      state.selectedSettlementAccountRemoteId,
      state.status,
      state.surchargeInput,
      state.totals,
      taxSummaryLabel,
      state.customerOptions,
      state.moneyAccountOptions,
      recentProducts,
      onClearCustomer,
      onCloseCustomerCreateModal,
      onCustomerCreateFormChange,
      onCustomerSearchChange,
      onOpenCustomerCreateModal,
      onCreateCustomer,
      onSettlementAccountChange,
      onOpenReceiptModal,
      onSelectCustomer,
    ],
  );
}
