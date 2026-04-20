import { RecordOrderPaymentUseCase } from "@/feature/orders/useCase/recordOrderPayment.useCase";
import { RefundOrderUseCase } from "@/feature/orders/useCase/refundOrder.useCase";
import { CancelOrderUseCase } from "@/feature/orders/useCase/cancelOrder.useCase";
import { ReturnOrderUseCase } from "@/feature/orders/useCase/returnOrder.useCase";
import { ChangeOrderStatusUseCase } from "@/feature/orders/useCase/changeOrderStatus.useCase";
import { OrderStatusValue } from "@/feature/orders/types/order.types";
import { DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import {
  OrderDetailView,
  OrderMoneyActionValue,
  OrderMoneyFormState,
} from "./orders.viewModel";

export type OrderMoneyActionViewModelParams = {
  canManage: boolean;
  accountRemoteId: string | null;
  ownerUserRemoteId: string | null;
  accountDisplayNameSnapshot: string;
  resolvedCurrencyCode: string;
  detail: OrderDetailView | null;
  moneyAccountOptions: DropdownOption[];
  setErrorMessage: (message: string | null) => void;
  loadAll: () => Promise<void>;
  refreshDetail: (remoteId: string) => Promise<void>;
  changeOrderStatusUseCase: ChangeOrderStatusUseCase;
  cancelOrderUseCase: CancelOrderUseCase;
  returnOrderUseCase: ReturnOrderUseCase;
  recordOrderPaymentUseCase: RecordOrderPaymentUseCase;
  refundOrderUseCase: RefundOrderUseCase;
};

export type OrderMoneyActionViewModelState = {
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
  resetModalState: () => void;
};
