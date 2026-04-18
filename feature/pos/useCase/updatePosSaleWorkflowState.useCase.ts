import type { PosSaleRepository } from "../data/repository/posSale.repository";
import type { UpdatePosSaleWorkflowStateParams } from "../types/posSale.dto.types";
import type { PosSaleResult } from "../types/posSale.error.types";

export type UpdatePosSaleWorkflowStateRepository = Pick<
  PosSaleRepository,
  "updatePosSaleWorkflowState"
>;

export interface UpdatePosSaleWorkflowStateUseCase {
  execute(params: UpdatePosSaleWorkflowStateParams): Promise<PosSaleResult>;
}
