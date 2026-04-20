import { Result } from "@/shared/types/result.types";
import {
  OrderLegacyTransactionLinkRepairWorkflowInput,
  OrderLegacyTransactionLinkRepairWorkflowResult,
} from "../types/orderLegacyTransactionLinkRepairWorkflow.types";

export interface RunOrderLegacyTransactionLinkRepairUseCase {
  execute(
    params: OrderLegacyTransactionLinkRepairWorkflowInput,
  ): Promise<Result<OrderLegacyTransactionLinkRepairWorkflowResult>>;
}
