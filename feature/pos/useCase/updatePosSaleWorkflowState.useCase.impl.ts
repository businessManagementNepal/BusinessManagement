import type {
  UpdatePosSaleWorkflowStateRepository,
  UpdatePosSaleWorkflowStateUseCase,
} from "./updatePosSaleWorkflowState.useCase";
import type { UpdatePosSaleWorkflowStateParams } from "../types/posSale.dto.types";
import type { PosSaleResult } from "../types/posSale.error.types";

export const createUpdatePosSaleWorkflowStateUseCase = (
  repository: UpdatePosSaleWorkflowStateRepository,
): UpdatePosSaleWorkflowStateUseCase => ({
  async execute(
    params: UpdatePosSaleWorkflowStateParams,
  ): Promise<PosSaleResult> {
    return repository.updatePosSaleWorkflowState(params);
  },
});
