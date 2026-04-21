import { Result } from "../../../shared/types/result.types";
import { Order, OrderError } from "../types/order.types";
import { OrderSettlementSnapshot } from "../types/orderSettlement.dto.types";

export type { OrderSettlementSnapshot } from "../types/orderSettlement.dto.types";

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
