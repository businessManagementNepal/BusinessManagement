import {
  OrderOperationResult,
  OrderResult,
  OrdersResult,
  SaveOrderPayload,
} from "@/feature/orders/types/order.types";

export interface OrderRepository {
  saveOrder(payload: SaveOrderPayload): Promise<OrderResult>;
  getOrdersByAccountRemoteId(accountRemoteId: string): Promise<OrdersResult>;
  getOrderByRemoteId(remoteId: string): Promise<OrderResult>;
  deleteOrderByRemoteId(remoteId: string): Promise<OrderOperationResult>;
  updateOrderStatusByRemoteId(
    remoteId: string,
    status: SaveOrderPayload["status"],
  ): Promise<OrderResult>;
  removeOrderItemByRemoteId(remoteId: string): Promise<OrderOperationResult>;
  assignOrderCustomer(
    orderRemoteId: string,
    customerRemoteId: string | null,
  ): Promise<OrderResult>;
  linkOrderCommercialAnchors(params: {
    orderRemoteId: string;
    linkedBillingDocumentRemoteId: string | null;
    linkedLedgerDueEntryRemoteId: string | null;
  }): Promise<OrderResult>;
}
