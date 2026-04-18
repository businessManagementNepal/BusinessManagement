import type {
  CreatePosSaleRecordParams,
  GetPosSaleByIdempotencyKeyParams,
  UpdatePosSaleWorkflowStateParams,
} from "../../types/posSale.dto.types";
import type { PosSaleModel } from "./db/posSale.model";
import type { Result } from "@/shared/types/result.types";

export interface PosSaleDatasource {
  createPosSaleRecord(
    params: CreatePosSaleRecordParams,
  ): Promise<Result<PosSaleModel>>;
  getPosSaleByIdempotencyKey(
    params: GetPosSaleByIdempotencyKeyParams,
  ): Promise<Result<PosSaleModel | null>>;
  updatePosSaleWorkflowState(
    params: UpdatePosSaleWorkflowStateParams,
  ): Promise<Result<PosSaleModel>>;
}
