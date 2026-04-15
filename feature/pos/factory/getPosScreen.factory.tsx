import { createLocalMoneyAccountDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccount.datasource.impl";
import { createMoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository.impl";
import { createGetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase.impl";
import { createLocalBillingDatasource } from "@/feature/billing/data/dataSource/local.billing.datasource.impl";
import { createBillingRepository } from "@/feature/billing/data/repository/billing.repository.impl";
import { createSaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase.impl";
import { createSaveBillingDocumentAllocationsUseCase } from "@/feature/billing/useCase/saveBillingDocumentAllocations.useCase.impl";
import { createLocalContactDatasource } from "@/feature/contacts/data/dataSource/local.contact.datasource.impl";
import { createContactRepository } from "@/feature/contacts/data/repository/contact.repository.impl";
import { createGetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase.impl";
import { createGetOrCreateBusinessContactUseCase } from "@/feature/contacts/useCase/getOrCreateBusinessContact.useCase.impl";
import { createGetOrCreateContactUseCase } from "@/feature/contacts/useCase/getOrCreateContact.useCase.impl";
import { createLocalLedgerDatasource } from "@/feature/ledger/data/dataSource/local.ledger.datasource.impl";
import { createLedgerRepository } from "@/feature/ledger/data/repository/ledger.repository.impl";
import { createAddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase.impl";
import { createLocalProductDatasource } from "@/feature/products/data/dataSource/local.product.datasource.impl";
import { createProductRepository } from "@/feature/products/data/repository/product.repository.impl";
import { createSaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase.impl";
import { createPostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase.impl";
import appDatabase from "@/shared/database/appDatabase";
import { TaxModeValue } from "@/shared/types/regionalFinance.types";
import React from "react";
import { createLocalPosDatasource } from "../data/dataSource/local.pos.datasource.impl";
import { createPosRepository } from "../data/repository/pos.repository.impl";
import { PosScreen } from "../ui/PosScreen";
import { createAddProductToCartUseCase } from "../useCase/addProductToCart.useCase.impl";
import { createApplyDiscountUseCase } from "../useCase/applyDiscount.useCase.impl";
import { createApplySurchargeUseCase } from "../useCase/applySurcharge.useCase.impl";
import { createAssignProductToSlotUseCase } from "../useCase/assignProductToSlot.useCase.impl";
import { createChangeCartLineQuantityUseCase } from "../useCase/changeCartLineQuantity.useCase.impl";
import { createClearCartUseCase } from "../useCase/clearCart.useCase.impl";
import { createClearPosSessionUseCase } from "../useCase/clearPosSession.useCase.impl";
import { createCompletePaymentUseCase } from "../useCase/completePayment.useCase.impl";
import { createCompletePosCheckoutUseCase } from "../useCase/completePosCheckout.useCase.impl";
import { createGetPosBootstrapUseCase } from "../useCase/getPosBootstrap.useCase.impl";
import { createLoadPosSessionUseCase } from "../useCase/loadPosSession.useCase.impl";
import { createPrintReceiptUseCase } from "../useCase/printReceipt.useCase.impl";
import { createRemoveProductFromSlotUseCase } from "../useCase/removeProductFromSlot.useCase.impl";
import { createSavePosSessionUseCase } from "../useCase/savePosSession.useCase.impl";
import { createSearchPosProductsUseCase } from "../useCase/searchPosProducts.useCase.impl";
import { createShareReceiptUseCase } from "../useCase/shareReceipt.useCase.impl";
import { usePosScreenViewModel } from "../viewModel/posScreen.viewModel.impl";

type GetPosScreenFactoryProps = {
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  activeSettlementAccountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  activeAccountDefaultTaxRatePercent: number | null;
  activeAccountDefaultTaxMode: TaxModeValue | null;
};

export function GetPosScreenFactory({
  activeBusinessAccountRemoteId,
  activeOwnerUserRemoteId,
  activeSettlementAccountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  activeAccountDefaultTaxRatePercent,
  activeAccountDefaultTaxMode,
}: GetPosScreenFactoryProps) {
  const datasource = React.useMemo(
    () => createLocalPosDatasource({ database: appDatabase }),
    [],
  );
  const repository = React.useMemo(
    () => createPosRepository(datasource),
    [datasource],
  );

  const getPosBootstrapUseCase = React.useMemo(
    () => createGetPosBootstrapUseCase(repository),
    [repository],
  );
  const searchPosProductsUseCase = React.useMemo(
    () => createSearchPosProductsUseCase(repository),
    [repository],
  );
  const assignProductToSlotUseCase = React.useMemo(
    () => createAssignProductToSlotUseCase(repository),
    [repository],
  );
  const addProductToCartUseCase = React.useMemo(
    () => createAddProductToCartUseCase(repository),
    [repository],
  );
  const removeProductFromSlotUseCase = React.useMemo(
    () => createRemoveProductFromSlotUseCase(repository),
    [repository],
  );
  const changeCartLineQuantityUseCase = React.useMemo(
    () => createChangeCartLineQuantityUseCase(repository),
    [repository],
  );
  const applyDiscountUseCase = React.useMemo(
    () => createApplyDiscountUseCase(repository),
    [repository],
  );
  const applySurchargeUseCase = React.useMemo(
    () => createApplySurchargeUseCase(repository),
    [repository],
  );
  const clearCartUseCase = React.useMemo(
    () => createClearCartUseCase(repository),
    [repository],
  );
  const completePaymentUseCase = React.useMemo(
    () => createCompletePaymentUseCase(repository),
    [repository],
  );
  const savePosSessionUseCase = React.useMemo(
    () => createSavePosSessionUseCase(repository),
    [repository],
  );
  const loadPosSessionUseCase = React.useMemo(
    () => createLoadPosSessionUseCase(repository),
    [repository],
  );
  const clearPosSessionUseCase = React.useMemo(
    () => createClearPosSessionUseCase(repository),
    [repository],
  );
  const billingDatasource = React.useMemo(
    () => createLocalBillingDatasource(appDatabase),
    [],
  );
  const billingRepository = React.useMemo(
    () => createBillingRepository(billingDatasource),
    [billingDatasource],
  );
  const saveBillingDocumentUseCase = React.useMemo(
    () => createSaveBillingDocumentUseCase(billingRepository),
    [billingRepository],
  );
  const saveBillingDocumentAllocationsUseCase = React.useMemo(
    () => createSaveBillingDocumentAllocationsUseCase(billingRepository),
    [billingRepository],
  );
  const ledgerDatasource = React.useMemo(
    () => createLocalLedgerDatasource(appDatabase),
    [],
  );
  const ledgerRepository = React.useMemo(
    () => createLedgerRepository(ledgerDatasource),
    [ledgerDatasource],
  );
  const addLedgerEntryUseCase = React.useMemo(
    () => createAddLedgerEntryUseCase(ledgerRepository),
    [ledgerRepository],
  );
  const postBusinessTransactionUseCase = React.useMemo(
    () => createPostBusinessTransactionUseCase(appDatabase),
    [],
  );
  const contactDatasource = React.useMemo(
    () => createLocalContactDatasource(appDatabase),
    [],
  );
  const contactRepository = React.useMemo(
    () => createContactRepository(contactDatasource),
    [contactDatasource],
  );
  const getOrCreateContactUseCase = React.useMemo(
    () => createGetOrCreateContactUseCase(contactRepository),
    [contactRepository],
  );
  const getContactsUseCase = React.useMemo(
    () => createGetContactsUseCase(contactRepository),
    [contactRepository],
  );
  const getOrCreateBusinessContactUseCase = React.useMemo(
    () => createGetOrCreateBusinessContactUseCase(getOrCreateContactUseCase),
    [getOrCreateContactUseCase],
  );
  const completePosCheckoutUseCase = React.useMemo(
    () =>
      createCompletePosCheckoutUseCase({
        completePaymentUseCase,
        addLedgerEntryUseCase,
        saveBillingDocumentUseCase,
        saveBillingDocumentAllocationsUseCase,
        postBusinessTransactionUseCase,
        getOrCreateBusinessContactUseCase,
      }),
    [
      addLedgerEntryUseCase,
      completePaymentUseCase,
      postBusinessTransactionUseCase,
      saveBillingDocumentAllocationsUseCase,
      saveBillingDocumentUseCase,
      getOrCreateBusinessContactUseCase,
    ],
  );
  const printReceiptUseCase = React.useMemo(
    () => createPrintReceiptUseCase(),
    [],
  );

  const shareReceiptUseCase = React.useMemo(
    () => createShareReceiptUseCase(),
    [],
  );
  const productDatasource = React.useMemo(
    () => createLocalProductDatasource(appDatabase),
    [],
  );
  const productRepository = React.useMemo(
    () => createProductRepository(productDatasource),
    [productDatasource],
  );
  const saveProductUseCase = React.useMemo(
    () => createSaveProductUseCase(productRepository),
    [productRepository],
  );

  const moneyAccountDatasource = React.useMemo(
    () => createLocalMoneyAccountDatasource(appDatabase),
    [],
  );
  const moneyAccountRepository = React.useMemo(
    () => createMoneyAccountRepository(moneyAccountDatasource),
    [moneyAccountDatasource],
  );
  const getMoneyAccountsUseCase = React.useMemo(
    () => createGetMoneyAccountsUseCase(moneyAccountRepository),
    [moneyAccountRepository],
  );

  const viewModel = usePosScreenViewModel({
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
    printReceiptUseCase,
    shareReceiptUseCase,
    saveProductUseCase,
    savePosSessionUseCase,
    loadPosSessionUseCase,
    clearPosSessionUseCase,
    getMoneyAccountsUseCase,
  });

  return <PosScreen viewModel={viewModel} />;
}
