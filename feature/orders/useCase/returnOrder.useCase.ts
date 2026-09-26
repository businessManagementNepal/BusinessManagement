import {
  OrderResult,
  ReturnOrderInput,
} from "@/feature/orders/types/order.types";

export interface ReturnOrderUseCase {
  execute(input: ReturnOrderInput): Promise<OrderResult>;
}
