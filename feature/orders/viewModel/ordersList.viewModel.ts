import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import { Contact } from "@/feature/contacts/types/contact.types";
import { GetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase";
import { OrderStatusValue } from "@/feature/orders/types/order.types";
import { OrderSummaryState } from "@/feature/orders/types/order.state.types";
import { OrderSettlementSnapshot } from "@/feature/orders/types/orderSettlement.dto.types";
import { OrderListItemView } from "@/feature/orders/types/order.view.types";
import { Order } from "@/feature/orders/types/order.types";
import {
  GetOrderSettlementSnapshotsUseCase,
} from "@/feature/orders/useCase/getOrderSettlementSnapshots.useCase";
import { GetOrdersUseCase } from "@/feature/orders/useCase/getOrders.useCase";
import { Product } from "@/feature/products/types/product.types";
import { GetProductsUseCase } from "@/feature/products/useCase/getProducts.useCase";
import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";

export type OrdersListViewModelParams = {
  accountRemoteId: string | null;
  ownerUserRemoteId: string | null;
  accountCurrencyCode: string | null;
  accountCountryCode: string | null;
  accountDefaultTaxRatePercent: number | null;
  getOrdersUseCase: GetOrdersUseCase;
  getContactsUseCase: GetContactsUseCase;
  getProductsUseCase: GetProductsUseCase;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  getOrderSettlementSnapshotsUseCase: GetOrderSettlementSnapshotsUseCase;
};

export type OrdersListViewModelState = {
  searchQuery: string;
  statusFilter: "all" | OrderStatusValue;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | OrderStatusValue) => void;
  isLoading: boolean;
  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;
  orders: Order[];
  contactsByRemoteId: ReadonlyMap<string, Contact>;
  productsByRemoteId: ReadonlyMap<string, Product>;
  settlementSnapshotsByOrderRemoteId: Readonly<
    Record<string, OrderSettlementSnapshot>
  >;
  orderList: OrderListItemView[];
  filteredOrderList: OrderListItemView[];
  screenSummary: {
    activeCount: number;
    deliveredCount: number;
    cancelledCount: number;
  };
  summary: OrderSummaryState;
  customerOptions: DropdownOption[];
  customerPhoneByRemoteId: Readonly<Record<string, string | null>>;
  productOptions: DropdownOption[];
  productPriceByRemoteId: Readonly<Record<string, number>>;
  statusOptions: DropdownOption[];
  paymentMethodOptions: readonly DropdownOption[];
  moneyAccountOptions: DropdownOption[];
  taxRatePercent: number;
  resolvedCurrencyCode: string;
  loadAll: () => Promise<void>;
};
