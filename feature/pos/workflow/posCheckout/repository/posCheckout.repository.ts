import type { GetPosSaleByIdempotencyKeyParams } from "@/feature/pos/types/posSale.dto.types";
import type { PosSaleLookupResult } from "@/feature/pos/types/posSale.error.types";

export interface PosCheckoutRepository {
  getSaleByIdempotencyKey(
    params: GetPosSaleByIdempotencyKeyParams,
  ): Promise<PosSaleLookupResult>;
}
