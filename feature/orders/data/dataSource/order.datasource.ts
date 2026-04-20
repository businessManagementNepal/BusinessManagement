import {
  SaveOrderPayload,
} from "@/feature/orders/types/order.types";
import { Result } from "@/shared/types/result.types";
import { OrderLineModel } from "./db/orderLine.model";
import { OrderModel } from "./db/order.model";

export type OrderRecordBundle = {
  order: OrderModel;
  items: OrderLineModel[];
};

export interface OrderDatasource {
  saveOrder(payload: SaveOrderPayload): Promise<Result<OrderRecordBundle>>;
  getOrdersByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<OrderRecordBundle[]>>;
  getOrderByRemoteId(remoteId: string): Promise<Result<OrderRecordBundle | null>>;
  deleteOrderByRemoteId(remoteId: string): Promise<Result<boolean>>;
  updateOrderStatusByRemoteId(
    remoteId: string,
    status: SaveOrderPayload["status"],
  ): Promise<Result<OrderRecordBundle>>;
  removeOrderItemByRemoteId(remoteId: string): Promise<Result<boolean>>;
  assignOrderCustomer(
    orderRemoteId: string,
    customerRemoteId: string | null,
  ): Promise<Result<OrderRecordBundle>>;
  linkOrderCommercialAnchors(
    params: {
      orderRemoteId: string;
      linkedBillingDocumentRemoteId: string | null;
      linkedLedgerDueEntryRemoteId: string | null;
    },
  ): Promise<Result<OrderRecordBundle>>;
}
