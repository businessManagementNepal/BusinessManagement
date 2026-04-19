import type { PosError } from "@/feature/pos/types/pos.error.types";
import type { PosSaleHistoryItem } from "@/feature/pos/types/posSaleHistory.entity.types";
import type { Result } from "@/shared/types/result.types";

export type ResolvePosAbnormalSaleInput = {
  sale: PosSaleHistoryItem["sale"];
};

export type ResolvePosAbnormalSaleValue = {
  wasFullyCleaned: boolean;
};

export type ResolvePosAbnormalSaleResult = Result<
  ResolvePosAbnormalSaleValue,
  PosError
>;

export interface ResolvePosAbnormalSaleUseCase {
  execute(
    input: ResolvePosAbnormalSaleInput,
  ): Promise<ResolvePosAbnormalSaleResult>;
}
