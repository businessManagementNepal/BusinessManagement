import { OrderOperationResult } from "../types/order.types";

export interface RollbackOrderDraftCreateUseCase {
  execute(remoteId: string): Promise<OrderOperationResult>;
}
