import { createLocalMoneyAccountDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccount.datasource.impl";
import { createMoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository.impl";
import { MoneyAccountType, type SaveMoneyAccountPayload } from "@/feature/accounts/types/moneyAccount.types";
import { createGetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase.impl";
import { createSaveMoneyAccountUseCase } from "@/feature/accounts/useCase/saveMoneyAccount.useCase.impl";
import { createRunMoneyAccountOpeningBalanceWorkflowUseCase } from "@/feature/accounts/workflow/moneyAccountOpeningBalance/useCase/runMoneyAccountOpeningBalance.useCase.impl";
import { createLocalAuditDatasource } from "@/feature/audit/data/dataSource/local.audit.datasource.impl";
import { createAuditRepository } from "@/feature/audit/data/repository/audit.repository.impl";
import { createRecordAuditEventUseCase } from "@/feature/audit/useCase/recordAuditEvent.useCase.impl";
import { createLocalAccountDatasource } from "@/feature/auth/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/auth/accountSelection/data/repository/account.repository.impl";
import { AccountType, type SaveAccountPayload } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { createSaveAccountUseCase } from "@/feature/auth/accountSelection/useCase/saveAccount.useCase.impl";
import { createLocalBillingDatasource } from "@/feature/billing/data/dataSource/local.billing.datasource.impl";
import { createBillingRepository } from "@/feature/billing/data/repository/billing.repository.impl";
import { createDeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase.impl";
import { createGetBillingDocumentByRemoteIdUseCase } from "@/feature/billing/useCase/getBillingDocumentByRemoteId.useCase.impl";
import { createGetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase.impl";
import { createSaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase.impl";
import { createLocalInventoryDatasource } from "@/feature/inventory/data/dataSource/local.inventory.datasource.impl";
import { createInventoryRepository } from "@/feature/inventory/data/repository/inventory.repository.impl";
import { createCreateOpeningStockForProductUseCase } from "@/feature/inventory/useCase/createOpeningStockForProduct.useCase.impl";
import { createDeleteInventoryMovementsBySourceUseCase } from "@/feature/inventory/useCase/deleteInventoryMovementsBySource.useCase.impl";
import { createGetInventoryMovementsBySourceUseCase } from "@/feature/inventory/useCase/getInventoryMovementsBySource.useCase.impl";
import { createGetInventorySnapshotUseCase } from "@/feature/inventory/useCase/getInventorySnapshot.useCase.impl";
import { createSaveInventoryMovementUseCase } from "@/feature/inventory/useCase/saveInventoryMovement.useCase.impl";
import { createSaveInventoryMovementsUseCase } from "@/feature/inventory/useCase/saveInventoryMovements.useCase.impl";
import { createLocalLedgerDatasource } from "@/feature/ledger/data/dataSource/local.ledger.datasource.impl";
import { createLedgerRepository } from "@/feature/ledger/data/repository/ledger.repository.impl";
import { createAddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase.impl";
import { createDeleteLedgerEntryUseCase } from "@/feature/ledger/useCase/deleteLedgerEntry.useCase.impl";
import { createGetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase.impl";
import { createGetLedgerEntryByRemoteIdUseCase } from "@/feature/ledger/useCase/getLedgerEntryByRemoteId.useCase.impl";
import { createLocalPosDatasource } from "@/feature/pos/data/dataSource/local.pos.datasource.impl";
import { createLocalPosSaleDatasource } from "@/feature/pos/data/dataSource/local.posSale.datasource.impl";
import { createPosRepository } from "@/feature/pos/data/repository/pos.repository.impl";
import { createPosSaleRepository } from "@/feature/pos/data/repository/posSale.repository.impl";
import type { PosPaymentPartInput } from "@/feature/pos/types/pos.dto.types";
import type { PosCartLine, PosCustomer, PosTotals } from "@/feature/pos/types/pos.entity.types";
import { createCreatePosSaleDraftUseCase } from "@/feature/pos/useCase/createPosSaleDraft.useCase.impl";
import { createGetPosSalesUseCase } from "@/feature/pos/useCase/getPosSales.useCase.impl";
import { createUpdatePosSaleWorkflowStateUseCase } from "@/feature/pos/useCase/updatePosSaleWorkflowState.useCase.impl";
import { createCommitPosCheckoutInventoryUseCase } from "@/feature/pos/workflow/posCheckout/useCase/commitPosCheckoutInventory.useCase.impl";
import { createRunPosCheckoutUseCase } from "@/feature/pos/workflow/posCheckout/useCase/runPosCheckout.useCase.impl";
import { createReconcilePosSaleUseCase } from "@/feature/pos/workflow/posRecovery/useCase/reconcilePosSale.useCase.impl";
import { createResolvePosAbnormalSaleUseCase } from "@/feature/pos/workflow/posRecovery/useCase/resolvePosAbnormalSale.useCase.impl";
import { createRetryPosSalePostingUseCase } from "@/feature/pos/workflow/posRecovery/useCase/retryPosSalePosting.useCase.impl";
import { createLocalBusinessProfileDatasource } from "@/feature/profile/business/data/dataSource/local.businessProfile.datasource.impl";
import { createBusinessProfileRepository } from "@/feature/profile/business/data/repository/businessProfile.repository.impl";
import { createGetBusinessProfileByAccountRemoteIdUseCase } from "@/feature/profile/business/useCase/getBusinessProfileByAccountRemoteId.useCase.impl";
import { createSaveBusinessProfileUseCase } from "@/feature/profile/business/useCase/saveBusinessProfile.useCase.impl";
import { createLocalProductDatasource } from "@/feature/products/data/dataSource/local.product.datasource.impl";
import { createProductRepository } from "@/feature/products/data/repository/product.repository.impl";
import { ProductKind, ProductStatus, type SaveProductPayload } from "@/feature/products/types/product.types";
import { createCreateProductWithOpeningStockUseCase } from "@/feature/products/useCase/createProductWithOpeningStock.useCase.impl";
import { createDeleteProductUseCase } from "@/feature/products/useCase/deleteProduct.useCase.impl";
import { createSaveProductUseCase } from "@/feature/products/useCase/saveProduct.useCase.impl";
import { createLocalTransactionDatasource } from "@/feature/transactions/data/dataSource/local.transaction.datasource.impl";
import { createTransactionRepository } from "@/feature/transactions/data/repository/transaction.repository.impl";
import { type MoneyPostingRuntime, createMoneyPostingRuntime } from "@/feature/transactions/factory/createMoneyPostingRuntime.factory";
import { createGetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase.impl";
import { BUSINESS_TYPE_VALUES } from "@/shared/constants/businessType.constants";
import { createInMemoryWatermelonDatabase } from "./inMemoryWatermelonDb.helper";

const DEFAULT_BUSINESS_TYPE = BUSINESS_TYPE_VALUES[0];

export const DEFAULT_E2E_CONTEXT = {
  ownerUserRemoteId: "user-1",
  businessAccountRemoteId: "business-1",
  businessDisplayName: "Trendpal Traders",
  businessType: DEFAULT_BUSINESS_TYPE,
  accountCountryCode: "NP",
  businessCountry: "Nepal",
  currencyCode: "NPR",
  city: "Kathmandu",
  stateOrDistrict: "Bagmati",
  registeredAddress: "Kathmandu-1",
  businessPhone: "+9779800000000",
  businessEmail: "hello@trendpal.test",
  taxRegistrationId: "PAN-123456",
} as const;

type RunPosCheckoutDependencyOverrides = Partial<{
  saveBillingDocumentUseCase: ReturnType<typeof createSaveBillingDocumentUseCase>;
  deleteBillingDocumentUseCase: ReturnType<typeof createDeleteBillingDocumentUseCase>;
  postBusinessTransactionUseCase: MoneyPostingRuntime["postBusinessTransactionUseCase"];
  deleteBusinessTransactionUseCase: MoneyPostingRuntime["deleteBusinessTransactionUseCase"];
  addLedgerEntryUseCase: ReturnType<typeof createAddLedgerEntryUseCase>;
  deleteLedgerEntryUseCase: ReturnType<typeof createDeleteLedgerEntryUseCase>;
  commitPosCheckoutInventoryUseCase: ReturnType<typeof createCommitPosCheckoutInventoryUseCase>;
  recordAuditEventUseCase: ReturnType<typeof createRecordAuditEventUseCase>;
}>;

export const unwrapSuccess = <T>(result: {
  success: true;
  value: T;
} | {
  success: false;
  error: {
    message: string;
  };
}): T => {
  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.value;
};

export const buildE2eCustomer = (
  overrides: Partial<PosCustomer> = {},
): PosCustomer => ({
  remoteId: "contact-1",
  fullName: "Sita Customer",
  phone: "+9779811111111",
  address: null,
  ...overrides,
});

export const createBusinessFlowE2eHarness = () => {
  const { database, snapshotTable } = createInMemoryWatermelonDatabase({
    allowedTables: [
      "accounts",
      "business_profiles",
      "money_accounts",
      "transactions",
      "products",
      "inventory_movements",
      "billing_documents",
      "billing_document_items",
      "billing_document_allocations",
      "bill_photos",
      "pos_sales",
      "ledger_entries",
      "audit_events",
    ],
  });

  const accountDatasource = createLocalAccountDatasource(database);
  const accountRepository = createAccountRepository(accountDatasource);
  const saveAccountUseCase = createSaveAccountUseCase(accountRepository);

  const businessProfileDatasource = createLocalBusinessProfileDatasource(database);
  const businessProfileRepository = createBusinessProfileRepository(
    businessProfileDatasource,
  );
  const saveBusinessProfileUseCase = createSaveBusinessProfileUseCase(
    businessProfileRepository,
  );
  const getBusinessProfileByAccountRemoteIdUseCase =
    createGetBusinessProfileByAccountRemoteIdUseCase(
      businessProfileRepository,
    );

  const moneyAccountDatasource = createLocalMoneyAccountDatasource(database);
  const moneyAccountRepository = createMoneyAccountRepository(
    moneyAccountDatasource,
  );
  const moneyPostingRuntime = createMoneyPostingRuntime(database);
  const runMoneyAccountOpeningBalanceWorkflowUseCase =
    createRunMoneyAccountOpeningBalanceWorkflowUseCase({
      moneyAccountRepository,
      postMoneyMovementUseCase: moneyPostingRuntime.postMoneyMovementUseCase,
    });
  const saveMoneyAccountUseCase = createSaveMoneyAccountUseCase({
    repository: moneyAccountRepository,
    runMoneyAccountOpeningBalanceWorkflowUseCase,
  });
  const getMoneyAccountsUseCase = createGetMoneyAccountsUseCase(
    moneyAccountRepository,
  );

  const productDatasource = createLocalProductDatasource(database);
  const productRepository = createProductRepository(productDatasource);
  const saveProductUseCase = createSaveProductUseCase(productRepository);
  const deleteProductUseCase = createDeleteProductUseCase(productRepository);

  const inventoryDatasource = createLocalInventoryDatasource(database);
  const inventoryRepository = createInventoryRepository(inventoryDatasource);
  const saveInventoryMovementUseCase = createSaveInventoryMovementUseCase({
    inventoryRepository,
    productRepository,
  });
  const saveInventoryMovementsUseCase = createSaveInventoryMovementsUseCase({
    inventoryRepository,
    productRepository,
  });
  const createOpeningStockForProductUseCase =
    createCreateOpeningStockForProductUseCase({
      productRepository,
      saveInventoryMovementUseCase,
    });
  const createProductWithOpeningStockUseCase =
    createCreateProductWithOpeningStockUseCase({
      saveProductUseCase,
      deleteProductUseCase,
      createOpeningStockForProductUseCase,
    });
  const getInventorySnapshotUseCase = createGetInventorySnapshotUseCase(
    inventoryRepository,
  );
  const getInventoryMovementsBySourceUseCase =
    createGetInventoryMovementsBySourceUseCase(inventoryRepository);
  const deleteInventoryMovementsBySourceUseCase =
    createDeleteInventoryMovementsBySourceUseCase({
      inventoryRepository,
    });

  const billingDatasource = createLocalBillingDatasource(database);
  const billingRepository = createBillingRepository(billingDatasource);
  const saveBillingDocumentUseCase = createSaveBillingDocumentUseCase(
    billingRepository,
  );
  const deleteBillingDocumentUseCase = createDeleteBillingDocumentUseCase(
    billingRepository,
  );
  const getBillingOverviewUseCase = createGetBillingOverviewUseCase(
    billingRepository,
  );
  const getBillingDocumentByRemoteIdUseCase =
    createGetBillingDocumentByRemoteIdUseCase(billingRepository);

  const ledgerDatasource = createLocalLedgerDatasource(database);
  const ledgerRepository = createLedgerRepository(ledgerDatasource);
  const addLedgerEntryUseCase = createAddLedgerEntryUseCase(ledgerRepository);
  const deleteLedgerEntryUseCase = createDeleteLedgerEntryUseCase(
    ledgerRepository,
  );
  const getLedgerEntriesUseCase = createGetLedgerEntriesUseCase(
    ledgerRepository,
  );
  const getLedgerEntryByRemoteIdUseCase = createGetLedgerEntryByRemoteIdUseCase(
    ledgerRepository,
  );

  const posDatasource = createLocalPosDatasource({ database });
  const posRepository = createPosRepository(posDatasource);

  const posSaleDatasource = createLocalPosSaleDatasource({ database });
  const posSaleRepository = createPosSaleRepository(posSaleDatasource);
  const createPosSaleDraftUseCase = createCreatePosSaleDraftUseCase(
    posSaleRepository,
  );
  const updatePosSaleWorkflowStateUseCase =
    createUpdatePosSaleWorkflowStateUseCase(posSaleRepository);
  const getPosSalesUseCase = createGetPosSalesUseCase(posSaleRepository);

  const transactionDatasource = createLocalTransactionDatasource(database);
  const transactionRepository = createTransactionRepository(
    transactionDatasource,
  );
  const getTransactionsUseCase = createGetTransactionsUseCase(
    transactionRepository,
  );

  const auditDatasource = createLocalAuditDatasource(database);
  const auditRepository = createAuditRepository(auditDatasource);
  const recordAuditEventUseCase = createRecordAuditEventUseCase(
    auditRepository,
  );

  const commitPosCheckoutInventoryUseCase = createCommitPosCheckoutInventoryUseCase(
    {
      saveInventoryMovementsUseCase,
      getInventoryMovementsBySourceUseCase,
    },
  );

  const buildRunPosCheckoutUseCase = (
    overrides: RunPosCheckoutDependencyOverrides = {},
  ) =>
    createRunPosCheckoutUseCase({
      posCheckoutRepository: {
        getSaleByIdempotencyKey: (params) =>
          posSaleRepository.getPosSaleByIdempotencyKey(params),
      },
      createPosSaleDraftUseCase,
      updatePosSaleWorkflowStateUseCase,
      saveBillingDocumentUseCase:
        overrides.saveBillingDocumentUseCase ?? saveBillingDocumentUseCase,
      deleteBillingDocumentUseCase:
        overrides.deleteBillingDocumentUseCase ?? deleteBillingDocumentUseCase,
      postBusinessTransactionUseCase:
        overrides.postBusinessTransactionUseCase ??
        moneyPostingRuntime.postBusinessTransactionUseCase,
      deleteBusinessTransactionUseCase:
        overrides.deleteBusinessTransactionUseCase ??
        moneyPostingRuntime.deleteBusinessTransactionUseCase,
      addLedgerEntryUseCase:
        overrides.addLedgerEntryUseCase ?? addLedgerEntryUseCase,
      deleteLedgerEntryUseCase:
        overrides.deleteLedgerEntryUseCase ?? deleteLedgerEntryUseCase,
      commitPosCheckoutInventoryUseCase:
        overrides.commitPosCheckoutInventoryUseCase ??
        commitPosCheckoutInventoryUseCase,
      recordAuditEventUseCase:
        overrides.recordAuditEventUseCase ?? recordAuditEventUseCase,
    });

  const reconcilePosSaleUseCase = createReconcilePosSaleUseCase({
    getInventoryMovementsBySourceUseCase,
    getBillingDocumentByRemoteIdUseCase,
    getLedgerEntryByRemoteIdUseCase,
  });

  const resolvePosAbnormalSaleUseCase = createResolvePosAbnormalSaleUseCase({
    deleteInventoryMovementsBySourceUseCase,
    deleteBillingDocumentUseCase,
    deleteLedgerEntryUseCase,
    deleteBusinessTransactionUseCase:
      moneyPostingRuntime.deleteBusinessTransactionUseCase,
    updatePosSaleWorkflowStateUseCase,
    recordAuditEventUseCase,
  });

  const retryPosSalePostingUseCase = createRetryPosSalePostingUseCase({
    runPosCheckoutUseCase: buildRunPosCheckoutUseCase(),
    recordAuditEventUseCase,
  });

  const seedBusinessContext = async (
    overrides: Partial<{
      ownerUserRemoteId: string;
      businessAccountRemoteId: string;
      displayName: string;
      businessType: (typeof BUSINESS_TYPE_VALUES)[number];
      accountCountryCode: string;
      businessCountry: string;
      currencyCode: string;
      city: string;
      stateOrDistrict: string;
      registeredAddress: string;
      businessPhone: string;
      businessEmail: string;
      taxRegistrationId: string;
    }> = {},
  ) => {
    const accountPayload: SaveAccountPayload = {
      remoteId:
        overrides.businessAccountRemoteId ??
        DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
      ownerUserRemoteId:
        overrides.ownerUserRemoteId ?? DEFAULT_E2E_CONTEXT.ownerUserRemoteId,
      accountType: AccountType.Business,
      businessType:
        overrides.businessType ?? DEFAULT_E2E_CONTEXT.businessType,
      displayName:
        overrides.displayName ?? DEFAULT_E2E_CONTEXT.businessDisplayName,
      currencyCode:
        overrides.currencyCode ?? DEFAULT_E2E_CONTEXT.currencyCode,
      cityOrLocation: overrides.city ?? DEFAULT_E2E_CONTEXT.city,
      countryCode:
        overrides.accountCountryCode ??
        DEFAULT_E2E_CONTEXT.accountCountryCode,
      defaultTaxRatePercent: null,
      defaultTaxMode: null,
      isActive: true,
      isDefault: false,
    };

    const account = unwrapSuccess(await saveAccountUseCase.execute(accountPayload));

    const businessProfile = unwrapSuccess(
      await saveBusinessProfileUseCase.execute({
        accountRemoteId: account.remoteId,
        ownerUserRemoteId: account.ownerUserRemoteId,
        legalBusinessName: account.displayName,
        businessType:
          overrides.businessType ?? DEFAULT_E2E_CONTEXT.businessType,
        businessLogoUrl: null,
        businessPhone:
          overrides.businessPhone ?? DEFAULT_E2E_CONTEXT.businessPhone,
        businessEmail:
          overrides.businessEmail ?? DEFAULT_E2E_CONTEXT.businessEmail,
        registeredAddress:
          overrides.registeredAddress ??
          DEFAULT_E2E_CONTEXT.registeredAddress,
        currencyCode: account.currencyCode ?? DEFAULT_E2E_CONTEXT.currencyCode,
        country:
          overrides.businessCountry ?? DEFAULT_E2E_CONTEXT.businessCountry,
        city: overrides.city ?? DEFAULT_E2E_CONTEXT.city,
        stateOrDistrict:
          overrides.stateOrDistrict ?? DEFAULT_E2E_CONTEXT.stateOrDistrict,
        taxRegistrationId:
          overrides.taxRegistrationId ??
          DEFAULT_E2E_CONTEXT.taxRegistrationId,
        isActive: true,
      }),
    );

    return { account, businessProfile };
  };

  const createMoneyAccount = async (
    overrides: Partial<SaveMoneyAccountPayload> = {},
  ) =>
    unwrapSuccess(
      await saveMoneyAccountUseCase.execute({
        remoteId: "cash-1",
        ownerUserRemoteId: DEFAULT_E2E_CONTEXT.ownerUserRemoteId,
        scopeAccountRemoteId: DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
        scopeAccountDisplayNameSnapshot:
          DEFAULT_E2E_CONTEXT.businessDisplayName,
        name: "Cash Drawer",
        type: MoneyAccountType.Cash,
        currentBalance: 0,
        description: null,
        currencyCode: DEFAULT_E2E_CONTEXT.currencyCode,
        isPrimary: true,
        isActive: true,
        ...overrides,
      }),
    );

  const createProductWithOpeningStock = async (
    params: {
      product?: Partial<SaveProductPayload>;
      openingStockQuantity?: number | null;
    } = {},
  ) =>
    unwrapSuccess(
      await createProductWithOpeningStockUseCase.execute({
        product: {
          remoteId: "product-1",
          accountRemoteId: DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
          name: "Rice Bag",
          kind: ProductKind.Item,
          categoryName: "Groceries",
          salePrice: 1000,
          costPrice: 700,
          unitLabel: "bag",
          skuOrBarcode: "RICE-001",
          taxRateLabel: null,
          description: null,
          imageUrl: null,
          status: ProductStatus.Active,
          ...params.product,
        },
        openingStockQuantity: params.openingStockQuantity ?? 10,
      }),
    );

  const openPos = async (settlementAccountRemoteId = "cash-1") =>
    unwrapSuccess(
      await posRepository.loadBootstrap({
        activeBusinessAccountRemoteId:
          DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
        activeOwnerUserRemoteId: DEFAULT_E2E_CONTEXT.ownerUserRemoteId,
        activeSettlementAccountRemoteId: settlementAccountRemoteId,
      }),
    );

  const addProductToCart = async (productId: string) =>
    unwrapSuccess(await posRepository.addProductToCart({ productId }));

  const getCartSnapshot = async (): Promise<{
    cartLines: readonly PosCartLine[];
    totals: PosTotals;
  }> => ({
    cartLines: await posRepository.getCartLines(),
    totals: unwrapSuccess(await posRepository.getTotals()),
  });

  const checkout = async (params: {
    idempotencyKey: string;
    paymentParts: readonly PosPaymentPartInput[];
    selectedCustomer: PosCustomer | null;
    cartLinesSnapshot?: readonly PosCartLine[];
    totalsSnapshot?: PosTotals;
    grandTotalSnapshot?: number;
    checkoutUseCase?: ReturnType<typeof buildRunPosCheckoutUseCase>;
    activeBusinessAccountRemoteId?: string;
    activeOwnerUserRemoteId?: string;
    activeAccountCurrencyCode?: string | null;
    activeAccountCountryCode?: string | null;
  }) => {
    const cartSnapshot =
      params.cartLinesSnapshot !== undefined ||
      params.totalsSnapshot !== undefined
        ? {
            cartLines: params.cartLinesSnapshot ?? [],
            totals:
              params.totalsSnapshot ??
              ({
                itemCount: 0,
                gross: 0,
                discountAmount: 0,
                surchargeAmount: 0,
                taxAmount: 0,
                grandTotal: 0,
              } as PosTotals),
          }
        : await getCartSnapshot();

    return (params.checkoutUseCase ?? buildRunPosCheckoutUseCase()).execute({
      idempotencyKey: params.idempotencyKey,
      paymentParts: params.paymentParts,
      selectedCustomer: params.selectedCustomer,
      grandTotalSnapshot:
        params.grandTotalSnapshot ?? cartSnapshot.totals.grandTotal,
      cartLinesSnapshot: cartSnapshot.cartLines,
      totalsSnapshot: cartSnapshot.totals,
      activeBusinessAccountRemoteId:
        params.activeBusinessAccountRemoteId ??
        DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
      activeOwnerUserRemoteId:
        params.activeOwnerUserRemoteId ??
        DEFAULT_E2E_CONTEXT.ownerUserRemoteId,
      activeAccountCurrencyCode:
        params.activeAccountCurrencyCode ?? DEFAULT_E2E_CONTEXT.currencyCode,
      activeAccountCountryCode:
        params.activeAccountCountryCode ??
        DEFAULT_E2E_CONTEXT.accountCountryCode,
    });
  };

  return {
    database,
    repositories: {
      accountRepository,
      businessProfileRepository,
      moneyAccountRepository,
      productRepository,
      inventoryRepository,
      billingRepository,
      ledgerRepository,
      posRepository,
      posSaleRepository,
      transactionRepository,
    },
    useCases: {
      saveAccountUseCase,
      saveBusinessProfileUseCase,
      getBusinessProfileByAccountRemoteIdUseCase,
      saveMoneyAccountUseCase,
      getMoneyAccountsUseCase,
      createProductWithOpeningStockUseCase,
      getInventorySnapshotUseCase,
      getInventoryMovementsBySourceUseCase,
      getBillingOverviewUseCase,
      getBillingDocumentByRemoteIdUseCase,
      getLedgerEntriesUseCase,
      getLedgerEntryByRemoteIdUseCase,
      getPosSalesUseCase,
      getTransactionsUseCase,
      buildRunPosCheckoutUseCase,
      reconcilePosSaleUseCase,
      resolvePosAbnormalSaleUseCase,
      retryPosSalePostingUseCase,
      recordAuditEventUseCase,
    },
    seedBusinessContext,
    createMoneyAccount,
    createProductWithOpeningStock,
    openPos,
    addProductToCart,
    getCartSnapshot,
    checkout,
    lookupSaleByIdempotencyKey: async (idempotencyKey: string) => {
      const result = await posSaleRepository.getPosSaleByIdempotencyKey({
        businessAccountRemoteId: DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
        idempotencyKey,
      });

      if (!result.success) {
        throw new Error(result.error.message);
      }

      return result.value;
    },
    getPostedTransactions: async (
      accountRemoteId = DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
    ) =>
      unwrapSuccess(
        await transactionRepository.getPostedTransactionsByAccountRemoteId(
          accountRemoteId,
        ),
      ),
    getVisibleTransactions: async (
      ownerUserRemoteId = DEFAULT_E2E_CONTEXT.ownerUserRemoteId,
      accountRemoteId = DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
    ) =>
      unwrapSuccess(
        await getTransactionsUseCase.execute({
          ownerUserRemoteId,
          accountRemoteId,
        }),
      ),
    lookupTransaction: async (remoteId: string) =>
      transactionRepository.getTransactionByRemoteId(remoteId),
    lookupBillingDocument: async (remoteId: string) =>
      getBillingDocumentByRemoteIdUseCase.execute(remoteId),
    lookupLedgerEntry: async (remoteId: string) =>
      getLedgerEntryByRemoteIdUseCase.execute(remoteId),
    getMoneyAccounts: async (
      scopeAccountRemoteId = DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
    ) => unwrapSuccess(await getMoneyAccountsUseCase.execute(scopeAccountRemoteId)),
    getInventorySnapshot: async (
      accountRemoteId = DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
    ) =>
      unwrapSuccess(await getInventorySnapshotUseCase.execute(accountRemoteId)),
    getBillingOverview: async (
      accountRemoteId = DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
    ) => unwrapSuccess(await getBillingOverviewUseCase.execute(accountRemoteId)),
    getLedgerEntries: async (
      businessAccountRemoteId = DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
    ) =>
      unwrapSuccess(
        await getLedgerEntriesUseCase.execute({ businessAccountRemoteId }),
      ),
    getPosSales: async (
      businessAccountRemoteId = DEFAULT_E2E_CONTEXT.businessAccountRemoteId,
    ) =>
      unwrapSuccess(
        await getPosSalesUseCase.execute({ businessAccountRemoteId }),
      ),
    getAuditEventCount: () => snapshotTable("audit_events").length,
    snapshotTable,
  };
};
