import { createDeleteInventoryMovementsBySourceUseCase } from "@/feature/inventory/useCase/deleteInventoryMovementsBySource.useCase.impl";
import { describe, expect, it, vi } from "vitest";

describe("createDeleteInventoryMovementsBySourceUseCase", () => {
  it("returns success when no movements exist for the source", async () => {
    const inventoryRepository = {
      getInventoryMovementsBySource: vi.fn(async () => ({
        success: true as const,
        value: [],
      })),
      deleteInventoryMovementsByRemoteIds: vi.fn(),
    };

    const useCase = createDeleteInventoryMovementsBySourceUseCase({
      inventoryRepository: inventoryRepository as never,
    });

    const result = await useCase.execute({
      accountRemoteId: "account-1",
      sourceModule: "pos",
      sourceRemoteId: "sale-1",
    });

    expect(result.success).toBe(true);
    expect(
      inventoryRepository.deleteInventoryMovementsByRemoteIds,
    ).not.toHaveBeenCalled();
  });

  it("deletes found movements by remote ids", async () => {
    const inventoryRepository = {
      getInventoryMovementsBySource: vi.fn(async () => ({
        success: true as const,
        value: [{ remoteId: "move-1" }, { remoteId: "move-2" }],
      })),
      deleteInventoryMovementsByRemoteIds: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    };

    const useCase = createDeleteInventoryMovementsBySourceUseCase({
      inventoryRepository: inventoryRepository as never,
    });

    const result = await useCase.execute({
      accountRemoteId: "account-1",
      sourceModule: "pos",
      sourceRemoteId: "sale-1",
    });

    expect(result.success).toBe(true);
    expect(
      inventoryRepository.deleteInventoryMovementsByRemoteIds,
    ).toHaveBeenCalledWith(["move-1", "move-2"]);
  });
});
