import { OrderOperationResult } from "@/feature/orders/types/order.types";

export interface RollbackOrderDraftCreateUseCase {
  execute(remoteId: string): Promise<OrderOperationResult>;
}
