import { createResolveSyncConflictUseCase } from "@/feature/sync/useCase/resolveSyncConflict.useCase.impl";
import { SyncConflictResolutionAction } from "@/shared/sync/types/syncConflict.types";
import { describe, expect, it, vi } from "vitest";

describe("resolveSyncConflict use case", () => {
  it("delegates conflict resolution to the sync repository", async () => {
    const repository = {
      resolveConflict: vi.fn(async () => ({ success: true, value: true })),
    };
    const useCase = createResolveSyncConflictUseCase(repository as never);

    const result = await useCase.execute(
      "sync-conflict-1",
      SyncConflictResolutionAction.UseServer,
    );

    expect(result).toEqual({ success: true, value: true });
    expect(repository.resolveConflict).toHaveBeenCalledWith(
      "sync-conflict-1",
      SyncConflictResolutionAction.UseServer,
    );
  });
});
