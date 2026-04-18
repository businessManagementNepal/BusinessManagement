import type { PosSaleError } from "../types/posSale.error.types";
import type { PosSaleRecord } from "../types/posSale.entity.types";
import type { Result } from "@/shared/types/result.types";

export type GetPosSaleByIdParams = {
  saleRemoteId: string;
};

export type PosSaleByIdResult = Result<PosSaleRecord | null, PosSaleError>;

export interface PosSaleByIdReaderRepository {
  getPosSaleById(params: GetPosSaleByIdParams): Promise<PosSaleByIdResult>;
}

export interface GetPosSaleByIdUseCase {
  execute(params: GetPosSaleByIdParams): Promise<PosSaleByIdResult>;
}
