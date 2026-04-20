import { OrderOperationResult } from "@/feature/orders/types/order.types";

export interface RefundOrderUseCase {
  execute(params: {
    orderRemoteId: string;
    orderNumber: string;
    ownerUserRemoteId: string;
    accountRemoteId: string;
    accountDisplayNameSnapshot: string;
    currencyCode: string | null;
    amount: number;
    happenedAt: number;
    settlementMoneyAccountRemoteId: string;
    settlementMoneyAccountDisplayNameSnapshot: string;
    note: string | null;
    refundAttemptRemoteId: string;
  }): Promise<OrderOperationResult>;
}
