import { Order } from "@/feature/orders/types/order.types";
import { CreateOrderUseCase } from "@/feature/orders/useCase/createOrder.useCase";
import { GetOrderByIdUseCase } from "@/feature/orders/useCase/getOrderById.useCase";
import { OrderSettlementSnapshot } from "@/feature/orders/useCase/getOrderSettlementSnapshots.useCase";
import { UpdateOrderUseCase } from "@/feature/orders/useCase/updateOrder.useCase";
import {
  OrderFormPricingPreview,
  OrderFormState,
  OrderLineFormState,
} from "./orders.viewModel";

export type OrderEditorViewModelParams = {
  accountRemoteId: string | null;
  ownerUserRemoteId: string | null;
  canManage: boolean;
  accountCountryCode: string | null;
  resolvedCurrencyCode: string;
  taxRatePercent: number;
  orders: readonly Order[];
  settlementSnapshotsByOrderRemoteId: Readonly<
    Record<string, OrderSettlementSnapshot>
  >;
  productPriceByRemoteId: Readonly<Record<string, number>>;
  createOrderUseCase: CreateOrderUseCase;
  updateOrderUseCase: UpdateOrderUseCase;
  getOrderByIdUseCase: GetOrderByIdUseCase;
  loadAll: () => Promise<void>;
  refreshDetail: (remoteId: string) => Promise<void>;
  setErrorMessage: (message: string | null) => void;
};

export type OrderEditorViewModelState = {
  isEditorVisible: boolean;
  editorMode: "create" | "edit";
  form: OrderFormState;
  formPricingPreview: OrderFormPricingPreview;
  onOpenCreate: () => void;
  onOpenEdit: (remoteId: string) => Promise<void>;
  onCloseEditor: () => void;
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
};
