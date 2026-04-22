import type {
  InventoryOperationResult,
  InventorySourceLookupParams,
} from "@/feature/inventory/types/inventory.types";

export interface DeleteInventoryMovementsBySourceUseCase {
  execute(params: InventorySourceLookupParams): Promise<InventoryOperationResult>;
}
