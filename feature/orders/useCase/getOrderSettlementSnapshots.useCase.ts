import { Order, OrderError } from "@/feature/orders/types/order.types";
import { Result } from "@/shared/types/result.types";

export type OrderSettlementSnapshot = {
  orderRemoteId: string;
  paidAmount: number;
  refundedAmount: number;
  balanceDueAmount: number;
  billingDocumentRemoteId: string | null;
  dueEntryRemoteId: string | null;
};

export type GetOrderSettlementSnapshotsResult = Result<
  Readonly<Record<string, OrderSettlementSnapshot>>,
  OrderError
>;

export interface GetOrderSettlementSnapshotsUseCase {
  execute(params: {
    accountRemoteId: string;
    ownerUserRemoteId: string | null;
    orders: readonly Order[];
    attemptLegacyRepair?: boolean;
  }): Promise<GetOrderSettlementSnapshotsResult>;
}
