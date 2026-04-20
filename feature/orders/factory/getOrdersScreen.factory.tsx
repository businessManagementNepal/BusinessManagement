import { createLocalMoneyAccountDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccount.datasource.impl";
import { createMoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository.impl";
import { createGetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase.impl";
import { createLocalBillingDatasource } from "@/feature/billing/data/dataSource/local.billing.datasource.impl";
import { createBillingRepository } from "@/feature/billing/data/repository/billing.repository.impl";
import { createDeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase } from "@/feature/billing/useCase/deleteBillingDocumentAllocationsBySettlementEntryRemoteId.useCase.impl";
import { createDeleteBillingDocumentUseCase } from "@/feature/billing/useCase/deleteBillingDocument.useCase.impl";
import { createGetBillingDocumentByRemoteIdUseCase } from "@/feature/billing/useCase/getBillingDocumentByRemoteId.useCase.impl";
import { createGetBillingOverviewUseCase } from "@/feature/billing/useCase/getBillingOverview.useCase.impl";
import { createReplaceBillingDocumentAllocationsForSettlementEntryUseCase } from "@/feature/billing/useCase/replaceBillingDocumentAllocationsForSettlementEntry.useCase.impl";
import { createSaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase.impl";
import { createLocalContactDatasource } from "@/feature/contacts/data/dataSource/local.contact.datasource.impl";
import { createContactRepository } from "@/feature/contacts/data/repository/contact.repository.impl";
import { createGetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase.impl";
import { createLocalLedgerDatasource } from "@/feature/ledger/data/dataSource/local.ledger.datasource.impl";
import { createLedgerRepository } from "@/feature/ledger/data/repository/ledger.repository.impl";
import { createAddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase.impl";
import { createGetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase.impl";
import { createSaveLedgerEntryWithSettlementUseCase } from "@/feature/ledger/useCase/saveLedgerEntryWithSettlement.useCase.impl";
import { createUpdateLedgerEntryUseCase } from "@/feature/ledger/useCase/updateLedgerEntry.useCase.impl";
import { createLocalOrderDatasource } from "@/feature/orders/data/dataSource/local.order.datasource.impl";
import { createOrderRepository } from "@/feature/orders/data/repository/order.repository.impl";
import { OrdersScreen } from "@/feature/orders/ui/OrdersScreen";
import { createCancelOrderUseCase } from "@/feature/orders/useCase/cancelOrder.useCase.impl";
import { createChangeOrderStatusUseCase } from "@/feature/orders/useCase/changeOrderStatus.useCase.impl";
import { createCreateOrderUseCase } from "@/feature/orders/useCase/createOrder.useCase.impl";
import { createDeleteOrderUseCase } from "@/feature/orders/useCase/deleteOrder.useCase.impl";
import { createEnsureOrderBillingAndDueLinksUseCase } from "@/feature/orders/useCase/ensureOrderBillingAndDueLinks.useCase.impl";
import { createGetOrderByIdUseCase } from "@/feature/orders/useCase/getOrderById.useCase.impl";
import { createGetOrdersUseCase } from "@/feature/orders/useCase/getOrders.useCase.impl";
import { createRecordOrderPaymentUseCase } from "@/feature/orders/useCase/recordOrderPayment.useCase.impl";
import { createRefundOrderUseCase } from "@/feature/orders/useCase/refundOrder.useCase.impl";
import { createReturnOrderUseCase } from "@/feature/orders/useCase/returnOrder.useCase.impl";
import { createUpdateOrderUseCase } from "@/feature/orders/useCase/updateOrder.useCase.impl";
import { useOrdersViewModel } from "@/feature/orders/viewModel/orders.viewModel.impl";
import { createLocalProductDatasource } from "@/feature/products/data/dataSource/local.product.datasource.impl";
import { createProductRepository } from "@/feature/products/data/repository/product.repository.impl";
import { createGetProductsUseCase } from "@/feature/products/useCase/getProducts.useCase.impl";
import { createLocalTransactionDatasource } from "@/feature/transactions/data/dataSource/local.transaction.datasource.impl";
import { createTransactionRepository } from "@/feature/transactions/data/repository/transaction.repository.impl";
import { createDeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase.impl";
import { createGetTransactionsUseCase } from "@/feature/transactions/useCase/getTransactions.useCase.impl";
import { createPostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase.impl";
import appDatabase from "@/shared/database/appDatabase";
import React from "react";

type Props = {
  activeAccountRemoteId: string | null;
  activeUserRemoteId: string | null;
  activeAccountDisplayName: string;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  activeAccountDefaultTaxRatePercent: number | null;
  canManage: boolean;
};

export function GetOrdersScreenFactory({
  activeAccountRemoteId,
  activeUserRemoteId,
  activeAccountDisplayName,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  activeAccountDefaultTaxRatePercent,
  canManage,
}: Props) {
  const orderDatasource = React.useMemo(
    () => createLocalOrderDatasource(appDatabase),
    [],
  );
  const orderRepository = React.useMemo(
    () => createOrderRepository(orderDatasource),
    [orderDatasource],
  );
  const getOrdersUseCase = React.useMemo(
    () => createGetOrdersUseCase(orderRepository),
    [orderRepository],
  );
  const getOrderByIdUseCase = React.useMemo(
    () => createGetOrderByIdUseCase(orderRepository),
    [orderRepository],
  );
  const deleteOrderUseCase = React.useMemo(
    () => createDeleteOrderUseCase(orderRepository),
    [orderRepository],
  );
  const cancelOrderUseCase = React.useMemo(
    () => createCancelOrderUseCase(orderRepository),
    [orderRepository],
  );
  const returnOrderUseCase = React.useMemo(
    () => createReturnOrderUseCase(orderRepository),
    [orderRepository],
  );

  const contactDatasource = React.useMemo(
    () => createLocalContactDatasource(appDatabase),
    [],
  );
  const contactRepository = React.useMemo(
    () => createContactRepository(contactDatasource),
    [contactDatasource],
  );
  const getContactsUseCase = React.useMemo(
    () => createGetContactsUseCase(contactRepository),
    [contactRepository],
  );

  const productDatasource = React.useMemo(
    () => createLocalProductDatasource(appDatabase),
    [],
  );
  const productRepository = React.useMemo(
    () => createProductRepository(productDatasource),
    [productDatasource],
  );
  const getProductsUseCase = React.useMemo(
    () => createGetProductsUseCase(productRepository),
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
  const billingDatasource = React.useMemo(
    () => createLocalBillingDatasource(appDatabase),
    [],
  );
  const billingRepository = React.useMemo(
    () => createBillingRepository(billingDatasource),
    [billingDatasource],
  );
  const getBillingOverviewUseCase = React.useMemo(
    () => createGetBillingOverviewUseCase(billingRepository),
    [billingRepository],
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
  const replaceBillingDocumentAllocationsForSettlementEntryUseCase =
    React.useMemo(
      () =>
        createReplaceBillingDocumentAllocationsForSettlementEntryUseCase(
          billingRepository,
        ),
      [billingRepository],
    );
  const deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase =
    React.useMemo(
      () =>
        createDeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase(
          billingRepository,
        ),
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
  const getLedgerEntriesUseCase = React.useMemo(
    () => createGetLedgerEntriesUseCase(ledgerRepository),
    [ledgerRepository],
  );
  const addLedgerEntryUseCase = React.useMemo(
    () => createAddLedgerEntryUseCase(ledgerRepository),
    [ledgerRepository],
  );
  const updateLedgerEntryUseCase = React.useMemo(
    () => createUpdateLedgerEntryUseCase(ledgerRepository),
    [ledgerRepository],
  );

  const transactionDatasource = React.useMemo(
    () => createLocalTransactionDatasource(appDatabase),
    [],
  );
  const transactionRepository = React.useMemo(
    () => createTransactionRepository(transactionDatasource),
    [transactionDatasource],
  );
  const postBusinessTransactionUseCase = React.useMemo(
    () => createPostBusinessTransactionUseCase(appDatabase),
    [],
  );
  const deleteBusinessTransactionUseCase = React.useMemo(
    () => createDeleteBusinessTransactionUseCase(appDatabase),
    [],
  );
  const saveLedgerEntryWithSettlementUseCase = React.useMemo(
    () =>
      createSaveLedgerEntryWithSettlementUseCase({
        addLedgerEntryUseCase,
        updateLedgerEntryUseCase,
        getMoneyAccountsUseCase,
        postBusinessTransactionUseCase,
        deleteBusinessTransactionUseCase,
        saveBillingDocumentUseCase,
        replaceBillingDocumentAllocationsForSettlementEntryUseCase,
        deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
        deleteBillingDocumentUseCase,
      }),
    [
      addLedgerEntryUseCase,
      deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
      deleteBillingDocumentUseCase,
      deleteBusinessTransactionUseCase,
      getMoneyAccountsUseCase,
      postBusinessTransactionUseCase,
      replaceBillingDocumentAllocationsForSettlementEntryUseCase,
      saveBillingDocumentUseCase,
      updateLedgerEntryUseCase,
    ],
  );
  const getTransactionsUseCase = React.useMemo(
    () => createGetTransactionsUseCase(transactionRepository),
    [transactionRepository],
  );
  const ensureOrderBillingAndDueLinksUseCase = React.useMemo(
    () =>
      createEnsureOrderBillingAndDueLinksUseCase({
        orderRepository,
        getContactsUseCase,
        getBillingDocumentByRemoteIdUseCase,
        saveBillingDocumentUseCase,
        deleteBillingDocumentUseCase,
        getLedgerEntriesUseCase,
        addLedgerEntryUseCase,
        updateLedgerEntryUseCase,
      }),
    [
      addLedgerEntryUseCase,
      deleteBillingDocumentUseCase,
      getBillingDocumentByRemoteIdUseCase,
      getContactsUseCase,
      getLedgerEntriesUseCase,
      orderRepository,
      saveBillingDocumentUseCase,
      updateLedgerEntryUseCase,
    ],
  );
  const createOrderUseCase = React.useMemo(
    () =>
      createCreateOrderUseCase({
        repository: orderRepository,
        getProductsUseCase,
        deleteOrderUseCase,
        ensureOrderBillingAndDueLinksUseCase,
      }),
    [
      deleteOrderUseCase,
      ensureOrderBillingAndDueLinksUseCase,
      getProductsUseCase,
      orderRepository,
    ],
  );
  const updateOrderUseCase = React.useMemo(
    () =>
      createUpdateOrderUseCase({
        repository: orderRepository,
        getProductsUseCase,
        ensureOrderBillingAndDueLinksUseCase,
      }),
    [ensureOrderBillingAndDueLinksUseCase, getProductsUseCase, orderRepository],
  );
  const changeOrderStatusUseCase = React.useMemo(
    () =>
      createChangeOrderStatusUseCase({
        repository: orderRepository,
        ensureOrderBillingAndDueLinksUseCase,
      }),
    [ensureOrderBillingAndDueLinksUseCase, orderRepository],
  );
  const recordOrderPaymentUseCase = React.useMemo(
    () =>
      createRecordOrderPaymentUseCase({
        getBillingOverviewUseCase,
        getLedgerEntriesUseCase,
        saveLedgerEntryWithSettlementUseCase,
        ensureOrderBillingAndDueLinksUseCase,
      }),
    [
      ensureOrderBillingAndDueLinksUseCase,
      getBillingOverviewUseCase,
      getLedgerEntriesUseCase,
      saveLedgerEntryWithSettlementUseCase,
    ],
  );
  const refundOrderUseCase = React.useMemo(
    () =>
      createRefundOrderUseCase({
        getBillingOverviewUseCase,
        getLedgerEntriesUseCase,
        getTransactionsUseCase,
        saveBillingDocumentUseCase,
        deleteBillingDocumentUseCase,
        saveLedgerEntryWithSettlementUseCase,
        ensureOrderBillingAndDueLinksUseCase,
      }),
    [
      deleteBillingDocumentUseCase,
      ensureOrderBillingAndDueLinksUseCase,
      getBillingOverviewUseCase,
      getLedgerEntriesUseCase,
      getTransactionsUseCase,
      saveBillingDocumentUseCase,
      saveLedgerEntryWithSettlementUseCase,
    ],
  );

  const viewModel = useOrdersViewModel({
    accountRemoteId: activeAccountRemoteId,
    ownerUserRemoteId: activeUserRemoteId,
    accountDisplayNameSnapshot: activeAccountDisplayName,
    accountCurrencyCode: activeAccountCurrencyCode,
    accountCountryCode: activeAccountCountryCode,
    accountDefaultTaxRatePercent: activeAccountDefaultTaxRatePercent,
    canManage,
    getOrdersUseCase,
    getOrderByIdUseCase,
    createOrderUseCase,
    updateOrderUseCase,
    deleteOrderUseCase,
    changeOrderStatusUseCase,
    cancelOrderUseCase,
    returnOrderUseCase,
    recordOrderPaymentUseCase,
    refundOrderUseCase,
    getContactsUseCase,
    getProductsUseCase,
    getBillingOverviewUseCase,
    getLedgerEntriesUseCase,
    getMoneyAccountsUseCase,
    getTransactionsUseCase,
  });

  return <OrdersScreen viewModel={viewModel} />;
}
