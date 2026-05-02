import { SyncRepository } from "../data/repository/sync.repository";
import { ApplyPulledChangesUseCase } from "./applyPulledChanges.useCase";

export const createApplyPulledChangesUseCase = (
  repository: SyncRepository,
): ApplyPulledChangesUseCase => ({
  execute(scope, response) {
    return repository.applyPulledChanges(scope, response);
  },
});
