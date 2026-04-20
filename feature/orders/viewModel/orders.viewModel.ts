import { OrderStatusValue } from "@/feature/orders/types/order.types";
import {
  OrderFormPricingPreview,
  OrderFormState,
  OrderLineFormState,
  OrderMoneyActionValue,
  OrderMoneyFormState,
} from "@/feature/orders/types/order.state.types";
import {
  OrderDetailView,
  OrderListItemView,
} from "@/feature/orders/types/order.view.types";
import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";

export type {
  OrderFormPricingPreview,
  OrderFormState,
  OrderLineFormState,
  OrderMoneyActionValue,
  OrderMoneyFormState,
} from "@/feature/orders/types/order.state.types";
export type {
  OrderDetailItemView,
  OrderDetailPricingView,
  OrderDetailView,
  OrderListItemView,
} from "@/feature/orders/types/order.view.types";

export interface OrdersListPublicViewModel {
  searchQuery: string;
  statusFilter: "all" | OrderStatusValue;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | OrderStatusValue) => void;
  isLoading: boolean;
  errorMessage: string | null;
  summary: {
    activeCount: number;
    deliveredCount: number;
    cancelledCount: number;
  };
  orders: OrderListItemView[];
}

export interface OrdersSharedDataPublicViewModel {
  customerOptions: DropdownOption[];
  customerPhoneByRemoteId: Readonly<Record<string, string | null>>;
  productOptions: DropdownOption[];
  productPriceByRemoteId: Readonly<Record<string, number>>;
  statusOptions: DropdownOption[];
  paymentMethodOptions: readonly DropdownOption[];
  moneyAccountOptions: DropdownOption[];
}

export interface OrderEditorPublicViewModel {
  isEditorVisible: boolean;
  editorMode: "create" | "edit";
  form: OrderFormState;
  formPricingPreview: OrderFormPricingPreview;
  onCloseEditor: () => void;
  onFormChange: (field: keyof Omit<OrderFormState, "items">, value: string) => void;
  onLineItemChange: (remoteId: string, field: keyof OrderLineFormState, value: string) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (remoteId: string) => void;
  onSubmit: () => Promise<void>;
}

export interface OrderDetailsPublicViewModel {
  isDetailVisible: boolean;
  detail: OrderDetailView | null;
  onOpenDetail: (remoteId: string) => Promise<void>;
  onCloseDetail: () => void;
  onDelete: (remoteId: string) => Promise<void>;
}

export interface OrderMoneyActionPublicViewModel {
  isStatusModalVisible: boolean;
  statusDraft: OrderStatusValue;
  moneyForm: OrderMoneyFormState;
  onOpenStatusModal: () => void;
  onCloseStatusModal: () => void;
  onStatusDraftChange: (value: OrderStatusValue) => void;
  onSubmitStatus: () => Promise<void>;
  onCancelOrder: () => Promise<void>;
  onReturnOrder: () => Promise<void>;
  onOpenMoneyAction: (action: OrderMoneyActionValue) => void;
  onCloseMoneyAction: () => void;
  onMoneyFormChange: (
    field: keyof Omit<OrderMoneyFormState, "visible" | "action">,
    value: string,
  ) => void;
  onSubmitMoneyAction: () => Promise<void>;
}

export interface OrdersViewModel
  extends OrdersListPublicViewModel,
    OrdersSharedDataPublicViewModel,
    OrderEditorPublicViewModel,
    OrderDetailsPublicViewModel,
    OrderMoneyActionPublicViewModel {
  canManage: boolean;
  onRefresh: () => Promise<void>;
  onOpenCreate: () => void;
  onOpenEdit: (remoteId: string) => Promise<void>;
}
