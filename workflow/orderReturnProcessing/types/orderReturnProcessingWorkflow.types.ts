import { Order, OrderError } from "@/feature/orders/types/order.types";
import { Result } from "@/shared/types/result.types";

export type OrderReturnProcessingWorkflowInput = {
  orderRemoteId: string;
};

export type OrderReturnProcessingWorkflowResult = Result<Order, OrderError>;
