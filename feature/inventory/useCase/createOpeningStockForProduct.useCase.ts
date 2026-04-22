import { InventoryMovementResult } from "@/feature/inventory/types/inventory.types";

export interface CreateOpeningStockForProductUseCase {
  execute(payload: {
    accountRemoteId: string;
    productRemoteId: string;
    quantity: number;
    movementAt: number;
  }): Promise<InventoryMovementResult>;
}
