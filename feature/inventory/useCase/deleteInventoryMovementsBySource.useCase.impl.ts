import type { InventoryRepository } from "@/feature/inventory/data/repository/inventory.repository";
import { InventoryValidationError } from "@/feature/inventory/types/inventory.types";
import type { DeleteInventoryMovementsBySourceUseCase } from "./deleteInventoryMovementsBySource.useCase";

type CreateDeleteInventoryMovementsBySourceUseCaseParams = {
  inventoryRepository: InventoryRepository;
};

export const createDeleteInventoryMovementsBySourceUseCase = ({
  inventoryRepository,
}: CreateDeleteInventoryMovementsBySourceUseCaseParams): DeleteInventoryMovementsBySourceUseCase => ({
  async execute(params) {
    const accountRemoteId = params.accountRemoteId.trim();
    const sourceModule = params.sourceModule.trim();
    const sourceRemoteId = params.sourceRemoteId.trim();

    if (!accountRemoteId) {
      return {
        success: false,
        error: InventoryValidationError("Account remote id is required."),
      };
    }

    if (!sourceModule) {
      return {
        success: false,
        error: InventoryValidationError(
          "Inventory movement source module is required.",
        ),
      };
    }

    if (!sourceRemoteId) {
      return {
        success: false,
        error: InventoryValidationError(
          "Inventory movement source remote id is required.",
        ),
      };
    }

    const movementsResult = await inventoryRepository.getInventoryMovementsBySource(
      {
        accountRemoteId,
        sourceModule,
        sourceRemoteId,
      },
    );

    if (!movementsResult.success) {
      return {
        success: false,
        error: movementsResult.error,
      };
    }

    if (movementsResult.value.length === 0) {
      return { success: true, value: true };
    }

    return inventoryRepository.deleteInventoryMovementsByRemoteIds(
      movementsResult.value.map((movement) => movement.remoteId),
    );
  },
});
