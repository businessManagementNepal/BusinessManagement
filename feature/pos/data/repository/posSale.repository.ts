import type {
  CreatePosSaleRecordParams,
  GetPosSaleByIdempotencyKeyParams,
  UpdatePosSaleWorkflowStateParams,
} from "../../types/posSale.dto.types";
import type {
  PosSaleLookupResult,
  PosSaleResult,
} from "../../types/posSale.error.types";

export interface PosSaleRepository {
  createPosSaleRecord(params: CreatePosSaleRecordParams): Promise<PosSaleResult>;
  getPosSaleByIdempotencyKey(
    params: GetPosSaleByIdempotencyKeyParams,
  ): Promise<PosSaleLookupResult>;
  updatePosSaleWorkflowState(
    params: UpdatePosSaleWorkflowStateParams,
  ): Promise<PosSaleResult>;
}
