import { createLocalMoneyAccountDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccount.datasource.impl";
import { createMoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository.impl";
import { createGetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase.impl";
import { createLocalBillingDatasource } from "@/feature/billing/data/dataSource/local.billing.datasource.impl";
import { createBillingRepository } from "@/feature/billing/data/repository/billing.repository.impl";
import { createDeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase.impl";
import { createGetBillingDocumentByRemoteIdUseCase } from "@/feature/billing/useCase/getBillingDocumentByRemoteId.useCase.impl";
import { createSaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase.impl";
import { createLocalContactDatasource } from "@/feature/contacts/data/dataSource/local.contact.datasource.impl";
import { createContactRepository } from "@/feature/contacts/data/repository/contact.repository.impl";
import { createGetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase.impl";
import { createGetOrCreateBusinessContactUseCase } from "@/feature/contacts/useCase/getOrCreateBusinessContact.useCase.impl";
import { createGetOrCreateContactUseCase } from "@/feature/contacts/useCase/getOrCreateContact.useCase.impl";
import { createLocalLedgerDatasource } from "@/feature/ledger/data/dataSource/local.ledger.datasource.impl";
import { createLedgerRepository } from "@/feature/ledger/data/repository/ledger.repository.impl";
import { createAddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase.impl";
import { createDeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase.impl";
import { createGetLedgerEntryByRemoteIdUseCase } from "@/feature/ledger/useCase/getLedgerEntryByRemoteId.useCase.impl";
import { createLocalProductDatasource } from "@/feature/products/data/dataSource/local.product.datasource.impl";
import { createProductRepository } from "@/feature/products/data/repository/product.repository.impl";
import { createSaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase.impl";
import { createDeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase.impl";
import { createPostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase.impl";
import appDatabase from "@/shared/database/appDatabase";
import { TaxModeValue } from "@/shared/types/regionalFinance.types";
import { Q } from "@nozbe/watermelondb";
import React from "react";
import { createPosReceiptDocumentAdapter } from "../adapter/posReceiptDocument.adapter.impl";
import { PosSaleModel } from "../data/dataSource/db/posSale.model";
import { createLocalPosDatasource } from "../data/dataSource/local.pos.datasource.impl";
import { createPosRepository } from "../data/repository/pos.repository.impl";
import { PosScreen } from "../ui/PosScreen";
import { createAddProductToCartUseCase } from "../useCase/addProductToCart.useCase.impl";
import { createApplyDiscountUseCase } from "../useCase/applyDiscount.useCase.impl";
import { createApplySurchargeUseCase } from "../useCase/applySurcharge.useCase.impl";
import { createChangeCartLineQuantityUseCase } from "../useCase/changeCartLineQuantity.useCase.impl";
import { createClearCartUseCase } from "../useCase/clearCart.useCase.impl";
import { createClearPosSessionUseCase } from "../useCase/clearPosSession.useCase.impl";
import { createCommitPosSaleInventoryMutationsUseCase } from "../useCase/commitPosSaleInventoryMutations.useCase.impl";
import { createCreatePosSaleDraftUseCase } from "../useCase/createPosSaleDraft.useCase.impl";
import { createGetPosBootstrapUseCase } from "../useCase/getPosBootstrap.useCase.impl";
import { createGetPosSaleHistoryUseCase } from "../useCase/getPosSaleHistory.useCase.impl";
import {
  createGetPosSalesUseCase,
} from "../useCase/getPosSales.useCase.impl";
import { createLoadPosSessionUseCase } from "../useCase/loadPosSession.useCase.impl";
import { createPrintPosReceiptUseCase } from "../useCase/printPosReceipt.useCase.impl";
import { createSavePosSessionUseCase } from "../useCase/savePosSession.useCase.impl";
import { createSearchPosProductsUseCase } from "../useCase/searchPosProducts.useCase.impl";
import { createSharePosReceiptUseCase } from "../useCase/sharePosReceipt.useCase.impl";
import { createUpdatePosSaleWorkflowStateUseCase } from "../useCase/updatePosSaleWorkflowState.useCase.impl";
import type { PosSalesReaderRepository } from "../useCase/getPosSales.useCase";
import type { PosPaymentPartInput } from "../types/pos.dto.types";
import type { PosCartLine, PosReceipt } from "../types/pos.entity.types";
import type { PosSaleRecord } from "../types/posSale.entity.types";
import { PosSaleErrorType } from "../types/posSale.error.types";
import { usePosSaleHistoryViewModel } from "../viewModel/posSaleHistory.viewModel.impl";
import { usePosScreenCoordinatorViewModel } from "../viewModel/posScreenCoordinator.viewModel.impl";
import { createLocalPosSaleDatasource } from "../data/dataSource/local.posSale.datasource.impl";
import { createPosSaleRepository } from "../data/repository/posSale.repository.impl";
import { createPosCheckoutRepository } from "../workflow/posCheckout/repository/posCheckout.repository.impl";
import { createRunPosCheckoutUseCase } from "../workflow/posCheckout/useCase/runPosCheckout.useCase.impl";
import { createReconcilePosSaleUseCase } from "../workflow/posRecovery/useCase/reconcilePosSale.useCase.impl";
import { createResolvePosAbnormalSaleUseCase } from "../workflow/posRecovery/useCase/resolvePosAbnormalSale.useCase.impl";

type GetPosScreenFactoryProps = {
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  activeSettlementAccountRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  activeAccountDefaultTaxRatePercent: number | null;
  activeAccountDefaultTaxMode: TaxModeValue | null;
};

const parseJsonValue = <T,>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const mapPosSaleModelToDomain = (model: PosSaleModel): PosSaleRecord => ({
  remoteId: model.remoteId,
  receiptNumber: model.receiptNumber,
  businessAccountRemoteId: model.businessAccountRemoteId,
  ownerUserRemoteId: model.ownerUserRemoteId,
  idempotencyKey: model.idempotencyKey,
  workflowStatus: model.workflowStatus,
  customerRemoteId: model.customerRemoteId,
  customerNameSnapshot: model.customerNameSnapshot,
  customerPhoneSnapshot: model.customerPhoneSnapshot,
  currencyCode: model.currencyCode,
  countryCode: model.countryCode,
  cartLinesSnapshot: parseJsonValue<readonly PosCartLine[]>(
    model.cartLinesSnapshotJson,
    [],
  ),
  totalsSnapshot: {
    itemCount: model.itemCount,
    gross: model.gross,
    discountAmount: model.discountAmount,
    surchargeAmount: model.surchargeAmount,
    taxAmount: model.taxAmount,
    grandTotal: model.grandTotal,
  },
  paymentParts: parseJsonValue<readonly PosPaymentPartInput[]>(
    model.paymentPartsSnapshotJson,
    [],
  ),
  receipt: parseJsonValue<PosReceipt | null>(model.receiptSnapshotJson, null),
  billingDocumentRemoteId: model.billingDocumentRemoteId,
  ledgerEntryRemoteId: model.ledgerEntryRemoteId,
  postedTransactionRemoteIds: parseJsonValue<readonly string[]>(
    model.postedTransactionRemoteIdsJson,
    [],
  ),
  lastErrorType: model.lastErrorType,
  lastErrorMessage: model.lastErrorMessage,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});

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
  const addProductToCartUseCase = React.useMemo(
    () => createAddProductToCartUseCase(repository),
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
  const commitPosSaleInventoryMutationsUseCase = React.useMemo(
    () => createCommitPosSaleInventoryMutationsUseCase(repository),
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
  const getBillingDocumentByRemoteIdUseCase = React.useMemo(
    () => createGetBillingDocumentByRemoteIdUseCase(billingRepository),
    [billingRepository],
  );
  const saveBillingDocumentUseCase = React.useMemo(
    () => createSaveBillingDocumentUseCase(billingRepository),
    [billingRepository],
  );
  const deleteBillingDocumentUseCase = React.useMemo(
    () => createDeleteBillingDocumentUseCase(billingRepository),
    [billingRepository],
  );
  const posSaleDatasource = React.useMemo(
    () => createLocalPosSaleDatasource({ database: appDatabase }),
    [],
  );
  const posSaleRepository = React.useMemo(
    () => createPosSaleRepository(posSaleDatasource),
    [posSaleDatasource],
  );
  const createPosSaleDraftUseCase = React.useMemo(
    () => createCreatePosSaleDraftUseCase(posSaleRepository),
    [posSaleRepository],
  );
  const updatePosSaleWorkflowStateUseCase = React.useMemo(
    () => createUpdatePosSaleWorkflowStateUseCase(posSaleRepository),
    [posSaleRepository],
  );
  const posCheckoutRepository = React.useMemo(
    () => createPosCheckoutRepository({ posSaleRepository }),
    [posSaleRepository],
  );
  const posSalesReaderRepository = React.useMemo<PosSalesReaderRepository>(
    () => ({
      async getPosSales(params) {
        const businessAccountRemoteId = params.businessAccountRemoteId.trim();
        if (!businessAccountRemoteId) {
          return {
            success: false,
            error: {
              type: PosSaleErrorType.Validation,
              message:
                "Business account context is required to load POS sale history.",
            },
          };
        }

        try {
          const collection = appDatabase.get<PosSaleModel>("pos_sales");
          const records = await collection
            .query(
              Q.where("business_account_remote_id", businessAccountRemoteId),
              Q.where("deleted_at", Q.eq(null)),
              Q.sortBy("updated_at", Q.desc),
              Q.sortBy("created_at", Q.desc),
            )
            .fetch();

          return {
            success: true,
            value: records.map(mapPosSaleModelToDomain),
          };
        } catch (error) {
          return {
            success: false,
            error: {
              type: PosSaleErrorType.Unknown,
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to load POS sale records.",
            },
          };
        }
      },
    }),
    [],
  );
  const getPosSalesUseCase = React.useMemo(
    () => createGetPosSalesUseCase(posSalesReaderRepository),
    [posSalesReaderRepository],
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
  const getLedgerEntryByRemoteIdUseCase = React.useMemo(
    () => createGetLedgerEntryByRemoteIdUseCase(ledgerRepository),
    [ledgerRepository],
  );
  const deleteLedgerEntryUseCase = React.useMemo(
    () => createDeleteLedgerEntryUseCase(ledgerRepository),
    [ledgerRepository],
  );
  const postBusinessTransactionUseCase = React.useMemo(
    () => createPostBusinessTransactionUseCase(appDatabase),
    [],
  );
  const deleteBusinessTransactionUseCase = React.useMemo(
    () => createDeleteBusinessTransactionUseCase(appDatabase),
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
  const runPosCheckoutUseCase = React.useMemo(
    () =>
      createRunPosCheckoutUseCase({
        posCheckoutRepository,
        createPosSaleDraftUseCase,
        updatePosSaleWorkflowStateUseCase,
        saveBillingDocumentUseCase,
        deleteBillingDocumentUseCase,
        postBusinessTransactionUseCase,
        deleteBusinessTransactionUseCase,
        addLedgerEntryUseCase,
        deleteLedgerEntryUseCase,
        commitPosSaleInventoryMutationsUseCase,
      }),
    [
      addLedgerEntryUseCase,
      commitPosSaleInventoryMutationsUseCase,
      createPosSaleDraftUseCase,
      deleteBillingDocumentUseCase,
      deleteBusinessTransactionUseCase,
      deleteLedgerEntryUseCase,
      posCheckoutRepository,
      postBusinessTransactionUseCase,
      saveBillingDocumentUseCase,
      updatePosSaleWorkflowStateUseCase,
    ],
  );
  const receiptDocumentAdapter = React.useMemo(
    () => createPosReceiptDocumentAdapter(),
    [],
  );
  const printPosReceiptUseCase = React.useMemo(
    () =>
      createPrintPosReceiptUseCase({
        receiptDocumentAdapter,
      }),
    [receiptDocumentAdapter],
  );

  const sharePosReceiptUseCase = React.useMemo(
    () =>
      createSharePosReceiptUseCase({
        receiptDocumentAdapter,
      }),
    [receiptDocumentAdapter],
  );

  const getPosSaleHistoryUseCase = React.useMemo(
    () =>
      createGetPosSaleHistoryUseCase({
        getPosSalesUseCase,
      }),
    [getPosSalesUseCase],
  );

  const reconcilePosSaleUseCase = React.useMemo(
    () =>
      createReconcilePosSaleUseCase({
        getBillingDocumentByRemoteIdUseCase,
        getLedgerEntryByRemoteIdUseCase,
      }),
    [getBillingDocumentByRemoteIdUseCase, getLedgerEntryByRemoteIdUseCase],
  );

  const resolvePosAbnormalSaleUseCase = React.useMemo(
    () =>
      createResolvePosAbnormalSaleUseCase({
        deleteBillingDocumentUseCase,
        deleteLedgerEntryUseCase,
        deleteBusinessTransactionUseCase,
        updatePosSaleWorkflowStateUseCase,
      }),
    [
      deleteBillingDocumentUseCase,
      deleteBusinessTransactionUseCase,
      deleteLedgerEntryUseCase,
      updatePosSaleWorkflowStateUseCase,
    ],
  );

  const saleHistoryViewModel = usePosSaleHistoryViewModel({
    accountRemoteId: activeBusinessAccountRemoteId ?? "",
    currencyCode: activeAccountCurrencyCode ?? "NPR",
    countryCode: activeAccountCountryCode,
    getPosSaleHistoryUseCase,
    printPosReceiptUseCase,
    sharePosReceiptUseCase,
    reconcilePosSaleUseCase,
    resolvePosAbnormalSaleUseCase,
  });

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

  const viewModel = usePosScreenCoordinatorViewModel({
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
    printPosReceiptUseCase,
    sharePosReceiptUseCase,
    saveProductUseCase,
    savePosSessionUseCase,
    loadPosSessionUseCase,
    clearPosSessionUseCase,
    getMoneyAccountsUseCase,
    saleHistoryViewModel,
  });

  return <PosScreen viewModel={viewModel} />;
}
