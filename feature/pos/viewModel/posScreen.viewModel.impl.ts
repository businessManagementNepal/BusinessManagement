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
import {
  PosCartLine,
  PosCustomer,
  PosProduct,
  PosSlot,
  PosTotals,
} from "../types/pos.entity.types";
import { PosScreenState, PosScreenViewModel } from "../types/pos.state.types";
import { AddProductToCartUseCase } from "../useCase/addProductToCart.useCase";
import { ApplyDiscountUseCase } from "../useCase/applyDiscount.useCase";
import { ApplySurchargeUseCase } from "../useCase/applySurcharge.useCase";
import { AssignProductToSlotUseCase } from "../useCase/assignProductToSlot.useCase";
import { ChangeCartLineQuantityUseCase } from "../useCase/changeCartLineQuantity.useCase";
import { ClearCartUseCase } from "../useCase/clearCart.useCase";
import { ClearPosSessionUseCase } from "../useCase/clearPosSession.useCase";
import { CompletePosCheckoutUseCase } from "../useCase/completePosCheckout.useCase";
import { GetPosBootstrapUseCase } from "../useCase/getPosBootstrap.useCase";
import { LoadPosSessionUseCase } from "../useCase/loadPosSession.useCase";
import { PrintReceiptUseCase } from "../useCase/printReceipt.useCase";
import { RemoveProductFromSlotUseCase } from "../useCase/removeProductFromSlot.useCase";
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
  slots: [],
  cartLines: [],
  totals: EMPTY_TOTALS,
  activeSlotId: null,
  selectedSlotId: null,
  activeModal: "none",
  productSearchTerm: "",
  discountInput: "",
  surchargeInput: "",
  paymentInput: "",
  paymentSplitCountInput: "2",
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

const createEmptySlots = (): readonly PosSlot[] =>
  Array.from({ length: 16 }, (_, index) => ({
    slotId: `slot-${index + 1}`,
    assignedProductId: null,
  }));

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
  assignProductToSlotUseCase: AssignProductToSlotUseCase;
  addProductToCartUseCase: AddProductToCartUseCase;
  removeProductFromSlotUseCase: RemoveProductFromSlotUseCase;
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
    assignProductToSlotUseCase,
    addProductToCartUseCase,
    removeProductFromSlotUseCase,
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
  const currencyCode = useMemo(
    () => regionalFinancePolicy.currencyCode,
    [regionalFinancePolicy.currencyCode],
  );

  const recentProducts = useMemo(() => {
    // For production-grade implementation, track recently used products
    // For now, use empty array until products are added/used
    return state.recentProducts;
  }, [state.recentProducts]);

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

    const restoredFilteredProducts =
      didRestoreSession && sessionDataProductSearchTerm.trim().length > 0
        ? await searchPosProductsUseCase.execute(sessionDataProductSearchTerm)
        : [];

    const nextState = {
      status: Status.Success,
      bootstrap: result.value,
      slots: result.value.slots,
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
      totals: EMPTY_TOTALS,
      activeSlotId: null,
      selectedSlotId: null,
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

  const onPressSlot = useCallback(
    async (slotId: string) => {
      const selectedSlot = state.slots.find((slot) => slot.slotId === slotId);

      setState((currentState) => ({
        ...currentState,
        selectedSlotId: slotId,
        errorMessage: null,
      }));

      if (!selectedSlot?.assignedProductId) {
        return;
      }

      const result = await assignProductToSlotUseCase.execute({
        slotId,
        productId: selectedSlot.assignedProductId,
        addToCart: true,
      });

      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: result.error.message,
        }));
        return;
      }

      recalculateTotals(result.value);
    },
    [assignProductToSlotUseCase, recalculateTotals, state.slots],
  );

  const onLongPressSlot = useCallback((slotId: string) => {
    setState((currentState) => ({
      ...currentState,
      activeSlotId: slotId,
      selectedSlotId: slotId,
      activeModal: "product-selection",
      errorMessage: null,
      infoMessage: null,
    }));
  }, []);

  const onRemoveSlotProduct = useCallback(
    async (slotId: string) => {
      const result = await removeProductFromSlotUseCase.execute({ slotId });
      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: result.error.message,
        }));
        return;
      }

      setState((currentState) => {
        const nextSlots = currentState.slots.map((slot) =>
          slot.slotId === slotId ? { ...slot, assignedProductId: null } : slot,
        );
        return {
          ...currentState,
          slots: nextSlots,
        };
      });
      recalculateTotals(result.value);
    },
    [recalculateTotals, removeProductFromSlotUseCase],
  );

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

  const onSelectProduct = useCallback(
    async (productId: string) => {
      const activeSlotId = state.activeSlotId;
      if (!activeSlotId) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: "Select a slot before assigning a product.",
        }));
        return;
      }

      const result = await assignProductToSlotUseCase.execute({
        slotId: activeSlotId,
        productId,
        addToCart: false,
      });

      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          errorMessage: result.error.message,
        }));
        return;
      }

      setState((currentState) => {
        const nextSlots = currentState.slots.map((slot) =>
          slot.slotId === activeSlotId
            ? { ...slot, assignedProductId: productId }
            : slot,
        );
        return {
          ...currentState,
          slots: nextSlots,
          activeModal: "none",
          activeSlotId: null,
          selectedSlotId: activeSlotId,
          productSearchTerm: "",
          quickProductNameInput: "",
          quickProductPriceInput: "0",
          quickProductCategoryInput: "",
        };
      });

      // Don't reset filteredProducts - keep current search results
      recalculateTotals(result.value);
    },
    [
      assignProductToSlotUseCase,
      recalculateTotals,
      searchPosProductsUseCase,
      state.activeSlotId,
    ],
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
      activeSlotId: null,
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

      // Only update slots for actual slot lines, not direct-added lines (direct-{productId})
      if (line.slotId.startsWith("slot-")) {
        setState((currentState) => ({
          ...currentState,
          slots: currentState.slots.map((slot) => {
            if (slot.slotId !== line.slotId) {
              return slot;
            }

            return result.value.some(
              (cartLine) => cartLine.slotId === slot.slotId,
            )
              ? slot
              : { ...slot, assignedProductId: null };
          }),
        }));
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

  const onPaymentSplitCountInputChange = useCallback((value: string) => {
    setState((currentState) => ({
      ...currentState,
      paymentSplitCountInput: value,
    }));
  }, []);

  const onOpenDiscountModal = useCallback(() => {
    setState((currentState) => ({ ...currentState, activeModal: "discount" }));
  }, []);

  const onOpenSurchargeModal = useCallback(() => {
    setState((currentState) => ({ ...currentState, activeModal: "surcharge" }));
  }, []);

  const onOpenPaymentModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "payment",
      paymentInput:
        currentState.paymentInput || currentState.totals.grandTotal.toFixed(2),
      errorMessage: null,
      infoMessage: null,
    }));
  }, []);

  const onOpenSplitBillModal = useCallback(() => {
    const splitCount = Math.max(Number(state.paymentSplitCountInput || "2"), 2);
    const splitAmount =
      splitCount > 0 ? state.totals.grandTotal / splitCount : 0;

    setState((currentState) => ({
      ...currentState,
      infoMessage: `Split preview: ${splitCount} people x ${formatCurrencyAmount(
        {
          amount: splitAmount,
          currencyCode,
          countryCode: regionalFinancePolicy.countryCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      )}`,
    }));
  }, [
    currencyCode,
    regionalFinancePolicy.countryCode,
    state.paymentSplitCountInput,
    state.totals.grandTotal,
    state.isCreatingCustomer,
  ]);

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
      slots: createEmptySlots(),
      cartLines: [],
      totals: EMPTY_TOTALS,
      activeModal: "none",
      activeSlotId: null,
      selectedSlotId: null,
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

  const onCompletePayment = useCallback(async () => {
    const paidAmount = parseAmountInput(state.paymentInput);
    const settlementAccountRemoteId =
      state.selectedSettlementAccountRemoteId.trim();

    if (paidAmount > 0 && !settlementAccountRemoteId) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Select a settlement money account for paid sales.",
      }));
      return;
    }

    const result = await completePosCheckoutUseCase.execute({
      paidAmount,
      activeBusinessAccountRemoteId,
      activeOwnerUserRemoteId,
      activeSettlementAccountRemoteId: settlementAccountRemoteId || null,
      activeAccountCurrencyCode: currencyCode,
      activeAccountCountryCode: regionalFinancePolicy.countryCode,
      selectedCustomer: state.selectedCustomer,
      grandTotalSnapshot: state.totals.grandTotal,
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
      slots: createEmptySlots(),
      cartLines: [],
      totals: EMPTY_TOTALS,
      activeModal: "receipt",
      activeSlotId: null,
      selectedSlotId: null,
      discountInput: "",
      surchargeInput: "",
      paymentInput: "",
      receipt: result.value,
      filteredProducts: [], // Clear filtered products after checkout
      quickProductNameInput: "",
      quickProductPriceInput: "0",
      quickProductCategoryInput: "",
      infoMessage:
        result.value.ledgerEffect.type === "due_balance_created"
          ? `Sale completed. ${formatCurrencyAmount({
              amount: result.value.dueAmount,
              currencyCode,
              countryCode: regionalFinancePolicy.countryCode,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} was posted as ledger due.`
          : result.value.ledgerEffect.type === "due_balance_create_failed"
            ? `Sale completed. ${formatCurrencyAmount({
                amount: result.value.dueAmount,
                currencyCode,
                countryCode: regionalFinancePolicy.countryCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} due could not be posted automatically. Add it from Ledger.`
            : result.value.ledgerEffect.type === "posting_sync_failed"
              ? "Sale completed, but accounting sync failed. Please review Ledger/Billing."
              : "Sale completed successfully.",
      errorMessage: null,
    }));

    // Clear session after successful checkout
    if (activeBusinessAccountRemoteId) {
      await clearPosSessionUseCase.execute({
        businessAccountRemoteId: activeBusinessAccountRemoteId,
      });
    }
  }, [
    activeBusinessAccountRemoteId,
    clearPosSessionUseCase,
    activeOwnerUserRemoteId,
    activeSettlementAccountRemoteId,
    completePosCheckoutUseCase,
    currencyCode,
    regionalFinancePolicy,
    searchPosProductsUseCase,
    state.selectedCustomer,
    state.paymentInput,
  ]);

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
    setState((currentState) => ({
      ...currentState,
      activeModal: "none",
    }));
  }, []);

  const onConfirmPayment = useCallback(async () => {
    await onCompletePayment();
  }, [onCompletePayment]);

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
      slots: state.slots,
      cartLines: state.cartLines,
      totals: state.totals,
      products: state.filteredProducts, // Only show filtered products, never all products
      filteredProducts: state.filteredProducts,
      recentProducts,
      activeSlotId: state.activeSlotId,
      selectedSlotId: state.selectedSlotId,
      activeModal: state.activeModal,
      productSearchTerm: state.productSearchTerm,
      discountInput: state.discountInput,
      surchargeInput: state.surchargeInput,
      paymentInput: state.paymentInput,
      paymentSplitCountInput: state.paymentSplitCountInput,
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
      onPressSlot,
      onLongPressSlot,
      onRemoveSlotProduct,
      onProductSearchChange,
      onSelectProduct,
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
      onPaymentSplitCountInputChange,
      onOpenDiscountModal,
      onOpenSurchargeModal,
      onOpenPaymentModal,
      onClosePaymentModal,
      onConfirmPayment,
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
      onOpenSplitBillModal,
      onApplyDiscount,
      onApplySurcharge,
      onClearCart,
      onCompletePayment,
      customerOptions: state.customerOptions,
      moneyAccountOptions: state.moneyAccountOptions,
      selectedSettlementAccountRemoteId:
        state.selectedSettlementAccountRemoteId,
      isCreatingCustomer: state.isCreatingCustomer,
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
      onCompletePayment,
      onDecreaseQuantity,
      onDiscountInputChange,
      onIncreaseQuantity,
      onPressSlot,
      onLongPressSlot,
      onOpenDiscountModal,
      onOpenPaymentModal,
      onOpenSplitBillModal,
      onOpenSurchargeModal,
      onPaymentInputChange,
      onPaymentSplitCountInputChange,
      onPrintReceipt,
      onShareReceipt,
      onProductSearchChange,
      onOpenCreateProductModal,
      onCloseCreateProductModal,
      onQuickProductNameInputChange,
      onQuickProductPriceInputChange,
      onQuickProductCategoryInputChange,
      onRemoveCartLine,
      onRemoveSlotProduct,
      onSelectProduct,
      onAddProductToCart,
      state.customerCreateForm,
      state.customerSearchTerm,
      state.selectedCustomer,
      onClearCustomer,
      onCloseCustomerCreateModal,
      onClosePaymentModal,
      onConfirmPayment,
      onCustomerCreateFormChange,
      onCustomerSearchChange,
      onOpenCustomerCreateModal,
      onCloseCustomerCreateModal,
      onCreateCustomer,
      onSettlementAccountChange,
      onOpenReceiptModal,
      onSelectCustomer,
      onSurchargeInputChange,
      regionalFinancePolicy.countryCode,
      state.activeModal,
      state.activeSlotId,
      state.cartLines,
      state.discountInput,
      state.errorMessage,
      state.filteredProducts,
      state.infoMessage,
      state.paymentInput,
      state.paymentSplitCountInput,
      state.productSearchTerm,
      state.products,
      state.quickProductCategoryInput,
      state.quickProductNameInput,
      state.quickProductPriceInput,
      state.receipt,
      state.selectedSettlementAccountRemoteId,
      state.selectedSlotId,
      state.slots,
      state.status,
      state.surchargeInput,
      state.totals,
      taxSummaryLabel,
      state.customerOptions,
      state.moneyAccountOptions,
      recentProducts,
    ],
  );
}
