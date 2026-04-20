import { MoneyAccount } from "@/feature/accounts/types/moneyAccount.types";
import { Contact } from "@/feature/contacts/types/contact.types";
import { Order, OrderStatus } from "@/feature/orders/types/order.types";
import { OrderSettlementSnapshot } from "@/feature/orders/types/orderSettlement.dto.types";
import { Product } from "@/feature/products/types/product.types";
import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import {
    resolveCurrencyCode,
} from "@/shared/utils/currency/accountCurrency";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    OrdersListViewModelParams,
    OrdersListViewModelState,
} from "./ordersList.viewModel";
import {
    buildCustomerOptions,
    buildCustomerPhoneByRemoteId,
    buildOrderListItemView,
    buildOrderSummary,
    buildProductOptions,
    buildProductPriceByRemoteId,
    buildStatusOptions,
    mapMoneyAccountToOption,
    ORDER_PAYMENT_METHOD_OPTIONS,
    resolveTaxRatePercent,
} from "./ordersPresentation.helpers";

const toSortedMoneyAccountOptions = (
  moneyAccounts: readonly MoneyAccount[],
): DropdownOption[] =>
  moneyAccounts
    .filter((moneyAccount) => moneyAccount.isActive)
    .sort((left, right) => {
      if (left.isPrimary && !right.isPrimary) {
        return -1;
      }
      if (!left.isPrimary && right.isPrimary) {
        return 1;
      }
      return left.name.localeCompare(right.name);
    })
    .map(mapMoneyAccountToOption);

const isActiveOrderStatus = (status: string): boolean =>
  status !== OrderStatus.Delivered &&
  status !== OrderStatus.Cancelled &&
  status !== OrderStatus.Returned;

export const useOrdersListViewModel = ({
  accountRemoteId,
  ownerUserRemoteId,
  accountCurrencyCode,
  accountCountryCode,
  accountDefaultTaxRatePercent,
  getOrdersUseCase,
  getContactsUseCase,
  getProductsUseCase,
  getMoneyAccountsUseCase,
  getOrderSettlementSnapshotsUseCase,
}: OrdersListViewModelParams): OrdersListViewModelState => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessageState] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [moneyAccountOptions, setMoneyAccountOptions] = useState<
    DropdownOption[]
  >([]);
  const [settlementSnapshotsByOrderRemoteId, setSettlementSnapshotsByOrderRemoteId] =
    useState<Record<string, OrderSettlementSnapshot>>({});

  const resolvedCurrencyCode = useMemo(
    () => resolveCurrencyCode({ currencyCode: accountCurrencyCode }),
    [accountCurrencyCode],
  );
  const taxRatePercent = useMemo(
    () => resolveTaxRatePercent(accountDefaultTaxRatePercent),
    [accountDefaultTaxRatePercent],
  );

  const contactsByRemoteId = useMemo(
    () => new Map(contacts.map((contact) => [contact.remoteId, contact])),
    [contacts],
  );
  const productsByRemoteId = useMemo(
    () => new Map(products.map((product) => [product.remoteId, product])),
    [products],
  );

  const setErrorMessage = useCallback((message: string | null) => {
    setErrorMessageState(message);
  }, []);

  const loadAll = useCallback(async () => {
    if (!accountRemoteId) {
      setOrders([]);
      setContacts([]);
      setProducts([]);
      setSettlementSnapshotsByOrderRemoteId({});
      setMoneyAccountOptions([]);
      setErrorMessageState("A business account is required to manage orders.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [
      ordersResult,
      contactsResult,
      productsResult,
      moneyAccountsResult,
    ] = await Promise.all([
      getOrdersUseCase.execute({ accountRemoteId }),
      getContactsUseCase.execute({ accountRemoteId }),
      getProductsUseCase.execute(accountRemoteId),
      getMoneyAccountsUseCase.execute(accountRemoteId),
    ]);

    if (!ordersResult.success) {
      setErrorMessageState(ordersResult.error.message);
      setIsLoading(false);
      return;
    }

    if (!contactsResult.success) {
      setErrorMessageState(contactsResult.error.message);
      setIsLoading(false);
      return;
    }

    if (!productsResult.success) {
      setErrorMessageState(productsResult.error.message);
      setIsLoading(false);
      return;
    }

    if (!moneyAccountsResult.success) {
      setErrorMessageState(moneyAccountsResult.error.message);
      setIsLoading(false);
      return;
    }

    const settlementSnapshotsResult =
      await getOrderSettlementSnapshotsUseCase.execute({
        accountRemoteId,
        ownerUserRemoteId,
        orders: ordersResult.value,
      });

    if (!settlementSnapshotsResult.success) {
      setErrorMessageState(settlementSnapshotsResult.error.message);
      setIsLoading(false);
      return;
    }

    setOrders(Array.isArray(ordersResult.value) ? ordersResult.value : []);
    setContacts(Array.isArray(contactsResult.value) ? contactsResult.value : []);
    setProducts(Array.isArray(productsResult.value) ? productsResult.value : []);
    setSettlementSnapshotsByOrderRemoteId(settlementSnapshotsResult.value);
    setMoneyAccountOptions(
      Array.isArray(moneyAccountsResult.value)
        ? toSortedMoneyAccountOptions(moneyAccountsResult.value)
        : [],
    );
    setErrorMessageState(null);
    setIsLoading(false);
  }, [
    accountRemoteId,
    getContactsUseCase,
    getMoneyAccountsUseCase,
    getOrderSettlementSnapshotsUseCase,
    getOrdersUseCase,
    getProductsUseCase,
    ownerUserRemoteId,
  ]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const orderList = useMemo(
    () =>
      orders.map((order) =>
        buildOrderListItemView({
          order,
          settlementSnapshot:
            settlementSnapshotsByOrderRemoteId[order.remoteId] ?? null,
          contactsByRemoteId,
          productsByRemoteId,
          taxRatePercent,
          currencyCode: resolvedCurrencyCode,
          countryCode: accountCountryCode,
        }),
      ),
    [
      accountCountryCode,
      contactsByRemoteId,
      orders,
      productsByRemoteId,
      resolvedCurrencyCode,
      settlementSnapshotsByOrderRemoteId,
      taxRatePercent,
    ],
  );

  const filteredOrderList = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return orderList.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchTarget = [
        order.orderNumber,
        order.customerName,
        order.itemsPreview,
        order.paymentMethodLabel,
      ]
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(normalizedSearch);
    });
  }, [orderList, searchQuery, statusFilter]);

  const screenSummary = useMemo(
    () => ({
      activeCount: filteredOrderList.filter((order) =>
        isActiveOrderStatus(order.status),
      ).length,
      deliveredCount: filteredOrderList.filter(
        (order) => order.status === OrderStatus.Delivered,
      ).length,
      cancelledCount: filteredOrderList.filter(
        (order) => order.status === OrderStatus.Cancelled,
      ).length,
    }),
    [filteredOrderList],
  );

  return {
    searchQuery,
    statusFilter,
    onSearchQueryChange: setSearchQuery,
    onStatusFilterChange: setStatusFilter,
    isLoading,
    errorMessage,
    setErrorMessage,
    orders,
    contactsByRemoteId,
    productsByRemoteId,
    settlementSnapshotsByOrderRemoteId,
    orderList,
    filteredOrderList,
    screenSummary,
    summary: buildOrderSummary(orders),
    customerOptions: buildCustomerOptions(contacts),
    customerPhoneByRemoteId: buildCustomerPhoneByRemoteId(contacts),
    productOptions: buildProductOptions(products),
    productPriceByRemoteId: buildProductPriceByRemoteId(products),
    statusOptions: buildStatusOptions(),
    paymentMethodOptions: ORDER_PAYMENT_METHOD_OPTIONS,
    moneyAccountOptions,
    taxRatePercent,
    resolvedCurrencyCode,
    loadAll,
  };
};
