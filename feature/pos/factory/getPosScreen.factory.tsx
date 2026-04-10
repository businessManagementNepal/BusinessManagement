import React from "react";
import { createLocalPosDatasource } from "../data/dataSource/local.pos.datasource.impl";
import { createPosRepository } from "../data/repository/pos.repository.impl";
import { createAssignProductToSlotUseCase } from "../useCase/assignProductToSlot.useCase.impl";
import { createApplyDiscountUseCase } from "../useCase/applyDiscount.useCase.impl";
import { createApplySurchargeUseCase } from "../useCase/applySurcharge.useCase.impl";
import { createChangeCartLineQuantityUseCase } from "../useCase/changeCartLineQuantity.useCase.impl";
import { createClearCartUseCase } from "../useCase/clearCart.useCase.impl";
import { createCompletePaymentUseCase } from "../useCase/completePayment.useCase.impl";
import { createCompletePosCheckoutUseCase } from "../useCase/completePosCheckout.useCase.impl";
import { createGetPosBootstrapUseCase } from "../useCase/getPosBootstrap.useCase.impl";
import { createPrintReceiptUseCase } from "../useCase/printReceipt.useCase.impl";
import { createRemoveProductFromSlotUseCase } from "../useCase/removeProductFromSlot.useCase.impl";
import { createSearchPosProductsUseCase } from "../useCase/searchPosProducts.useCase.impl";
import { createLocalBillingDatasource } from "@/feature/billing/data/dataSource/local.billing.datasource.impl";
import { createBillingRepository } from "@/feature/billing/data/repository/billing.repository.impl";
import { createSaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase.impl";
import { createSaveBillingDocumentAllocationsUseCase } from "@/feature/billing/useCase/saveBillingDocumentAllocations.useCase.impl";
import { createLocalLedgerDatasource } from "@/feature/ledger/data/dataSource/local.ledger.datasource.impl";
import { createLedgerRepository } from "@/feature/ledger/data/repository/ledger.repository.impl";
import { createAddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase.impl";
import { createLocalProductDatasource } from "@/feature/products/data/dataSource/local.product.datasource.impl";
import { createProductRepository } from "@/feature/products/data/repository/product.repository.impl";
import { createSaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase.impl";
import { createPostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase.impl";
import { TaxModeValue } from "@/shared/types/regionalFinance.types";
import { PosScreen } from "../ui/PosScreen";
import { usePosScreenViewModel } from "../viewModel/posScreen.viewModel.impl";
import appDatabase from "@/shared/database/appDatabase";

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
  const repository = React.useMemo(() => createPosRepository(datasource), [datasource]);

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
  const completePosCheckoutUseCase = React.useMemo(
    () =>
      createCompletePosCheckoutUseCase({
        completePaymentUseCase,
        addLedgerEntryUseCase,
        saveBillingDocumentUseCase,
        saveBillingDocumentAllocationsUseCase,
        postBusinessTransactionUseCase,
      }),
    [
      addLedgerEntryUseCase,
      completePaymentUseCase,
      postBusinessTransactionUseCase,
      saveBillingDocumentAllocationsUseCase,
      saveBillingDocumentUseCase,
    ],
  );
  const printReceiptUseCase = React.useMemo(
    () => createPrintReceiptUseCase(repository),
    [repository],
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
    removeProductFromSlotUseCase,
    changeCartLineQuantityUseCase,
    applyDiscountUseCase,
    applySurchargeUseCase,
    clearCartUseCase,
    completePosCheckoutUseCase,
    printReceiptUseCase,
    saveProductUseCase,
  });

  return <PosScreen viewModel={viewModel} />;
}
