import {
    OrderFormPricingPreview,
    OrderFormState,
    OrderLineFormState,
    OrderMoneyActionValue,
    OrderMoneyFormState,
} from "@/feature/orders/types/order.state.types";
import { OrderStatusValue } from "@/feature/orders/types/order.types";
import {
    OrderDetailView,
    OrderListItemView,
} from "@/feature/orders/types/order.view.types";
import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";

export type OrdersScreenSummaryState = {
  activeCount: number;
  deliveredCount: number;
  cancelledCount: number;
};

export interface OrdersViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  canManage: boolean;

  searchQuery: string;
  statusFilter: "all" | OrderStatusValue;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | OrderStatusValue) => void;

  summary: OrdersScreenSummaryState;
  orders: OrderListItemView[];

  customerOptions: DropdownOption[];
  customerPhoneByRemoteId: Readonly<Record<string, string | null>>;
  productOptions: DropdownOption[];
  productPriceByRemoteId: Readonly<Record<string, number>>;
  statusOptions: DropdownOption[];
  paymentMethodOptions: readonly DropdownOption[];
  moneyAccountOptions: DropdownOption[];

  isEditorVisible: boolean;
  editorMode: "create" | "edit";
  form: OrderFormState;
  formPricingPreview: OrderFormPricingPreview;

  isDetailVisible: boolean;
  detail: OrderDetailView | null;

  isStatusModalVisible: boolean;
  statusDraft: OrderStatusValue;

  moneyForm: OrderMoneyFormState;

  onRefresh: () => Promise<void>;
  onOpenCreate: () => void;
  onOpenEdit: (remoteId: string) => Promise<void>;
  onOpenDetail: (remoteId: string) => Promise<void>;
  onCloseEditor: () => void;
  onCloseDetail: () => void;

  onFormChange: (
    field: keyof Omit<OrderFormState, "items">,
    value: string,
  ) => void;
  onLineItemChange: (
    remoteId: string,
    field: keyof OrderLineFormState,
    value: string,
  ) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (remoteId: string) => void;
  onSubmit: () => Promise<void>;

  onDelete: (remoteId: string) => Promise<void>;

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
