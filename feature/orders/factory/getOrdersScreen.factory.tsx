import { createLocalMoneyAccountDatasource } from "@/feature/accounts/data/dataSource/local.moneyAccount.datasource.impl";
import { createMoneyAccountRepository } from "@/feature/accounts/data/repository/moneyAccount.repository.impl";
import { createGetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase.impl";
import { createLocalContactDatasource } from "@/feature/contacts/data/dataSource/local.contact.datasource.impl";
import { createContactRepository } from "@/feature/contacts/data/repository/contact.repository.impl";
import { createGetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase.impl";
import { createLocalOrderDatasource } from "@/feature/orders/data/dataSource/local.order.datasource.impl";
import { createOrderRepository } from "@/feature/orders/data/repository/order.repository.impl";
import { OrdersScreen } from "@/feature/orders/ui/OrdersScreen";
import { createCancelOrderUseCase } from "@/feature/orders/useCase/cancelOrder.useCase.impl";
import { createChangeOrderStatusUseCase } from "@/feature/orders/useCase/changeOrderStatus.useCase.impl";
import { createCreateOrderUseCase } from "@/feature/orders/useCase/createOrder.useCase.impl";
import { createDeleteOrderUseCase } from "@/feature/orders/useCase/deleteOrder.useCase.impl";
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
import { createAddTransactionUseCase } from "@/feature/transactions/useCase/addTransaction.useCase.impl";
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
  const changeOrderStatusUseCase = React.useMemo(
    () => createChangeOrderStatusUseCase(orderRepository),
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
  const createOrderUseCase = React.useMemo(
    () =>
      createCreateOrderUseCase({
        repository: orderRepository,
        getProductsUseCase,
      }),
    [getProductsUseCase, orderRepository],
  );
  const updateOrderUseCase = React.useMemo(
    () =>
      createUpdateOrderUseCase({
        repository: orderRepository,
        getProductsUseCase,
      }),
    [getProductsUseCase, orderRepository],
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
  const addTransactionUseCase = React.useMemo(
    () => createAddTransactionUseCase(postBusinessTransactionUseCase),
    [postBusinessTransactionUseCase],
  );
  const getTransactionsUseCase = React.useMemo(
    () => createGetTransactionsUseCase(transactionRepository),
    [transactionRepository],
  );
  const recordOrderPaymentUseCase = React.useMemo(
    () =>
      createRecordOrderPaymentUseCase({
        orderRepository,
        addTransactionUseCase,
        getTransactionsUseCase,
      }),
    [addTransactionUseCase, getTransactionsUseCase, orderRepository],
  );
  const refundOrderUseCase = React.useMemo(
    () =>
      createRefundOrderUseCase({
        orderRepository,
        addTransactionUseCase,
        getTransactionsUseCase,
      }),
    [addTransactionUseCase, getTransactionsUseCase, orderRepository],
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
    getMoneyAccountsUseCase,
    getTransactionsUseCase,
  });

  return <OrdersScreen viewModel={viewModel} />;
}
