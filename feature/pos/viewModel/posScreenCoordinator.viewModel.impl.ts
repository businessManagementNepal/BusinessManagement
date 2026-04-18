import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import type { GetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase";
import type { GetOrCreateBusinessContactUseCase } from "@/feature/contacts/useCase/getOrCreateBusinessContact.useCase";
import { SaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase";
import { TaxModeValue } from "@/shared/types/regionalFinance.types";
import {
  buildTaxRateLabel,
  buildTaxSummaryLabel,
  resolveRegionalFinancePolicy,
} from "@/shared/utils/finance/regionalFinancePolicy";
import { useMemo } from "react";
import { POS_SCREEN_TITLE } from "../types/pos.constant";
import { AddProductToCartUseCase } from "../useCase/addProductToCart.useCase";
import { ApplyDiscountUseCase } from "../useCase/applyDiscount.useCase";
import { ApplySurchargeUseCase } from "../useCase/applySurcharge.useCase";
import { ChangeCartLineQuantityUseCase } from "../useCase/changeCartLineQuantity.useCase";
import { ClearCartUseCase } from "../useCase/clearCart.useCase";
import { ClearPosSessionUseCase } from "../useCase/clearPosSession.useCase";
import { GetPosBootstrapUseCase } from "../useCase/getPosBootstrap.useCase";
import { LoadPosSessionUseCase } from "../useCase/loadPosSession.useCase";
import { PrintPosReceiptUseCase } from "../useCase/printPosReceipt.useCase";
import { SavePosSessionUseCase } from "../useCase/savePosSession.useCase";
import { SearchPosProductsUseCase } from "../useCase/searchPosProducts.useCase";
import { SharePosReceiptUseCase } from "../useCase/sharePosReceipt.useCase";
import type { RunPosCheckoutUseCase } from "../workflow/posCheckout/useCase/runPosCheckout.useCase";
import { usePosCartViewModel } from "./posCart.viewModel.impl";
import { usePosCatalogViewModel } from "./posCatalog.viewModel.impl";
import { usePosCheckoutCoordination } from "./posCheckout.viewModel.impl";
import { usePosCustomerViewModel } from "./posCustomer.viewModel.impl";
import { usePosScreenStateLifecycle } from "./internal/usePosScreenStateLifecycle";
import { usePosReceiptViewModel } from "./posReceipt.viewModel.impl";
import type { PosSaleHistoryViewModel } from "./posSaleHistory.viewModel";
import type { PosScreenCoordinatorViewModel } from "./posScreenCoordinator.viewModel";

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
  runPosCheckoutUseCase: RunPosCheckoutUseCase;
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
    runPosCheckoutUseCase,
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

  const { state, setState, load, saveCurrentSession } =
    usePosScreenStateLifecycle({
      activeBusinessAccountRemoteId,
      activeOwnerUserRemoteId,
      activeSettlementAccountRemoteId,
      getPosBootstrapUseCase,
      getMoneyAccountsUseCase,
      searchPosProductsUseCase,
      savePosSessionUseCase,
      loadPosSessionUseCase,
    });

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

  const { checkout, splitBill } = usePosCheckoutCoordination({
    state,
    setState,
    activeBusinessAccountRemoteId,
    activeOwnerUserRemoteId,
    currencyCode,
    countryCode: regionalFinancePolicy.countryCode,
    runPosCheckoutUseCase,
    clearPosSessionUseCase,
    saveCurrentSession,
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
