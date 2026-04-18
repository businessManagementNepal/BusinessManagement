import type { PosSaleWorkflowStatusValue } from "../types/posSale.constant";
import type { PosSaleError } from "../types/posSale.error.types";
import type { PosSaleRecord } from "../types/posSale.entity.types";
import type { Result } from "@/shared/types/result.types";

export type GetPosSalesParams = {
  businessAccountRemoteId: string;
  workflowStatus?: PosSaleWorkflowStatusValue;
};

export type PosSalesResult = Result<readonly PosSaleRecord[], PosSaleError>;

export interface PosSalesReaderRepository {
  getPosSales(params: GetPosSalesParams): Promise<PosSalesResult>;
}

export interface GetPosSalesUseCase {
  execute(params: GetPosSalesParams): Promise<PosSalesResult>;
}
