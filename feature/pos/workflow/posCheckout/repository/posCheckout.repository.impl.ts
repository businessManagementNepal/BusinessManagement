import type { PosSaleRepository } from "@/feature/pos/data/repository/posSale.repository";
import type { PosCheckoutRepository } from "./posCheckout.repository";
import type { GetPosSaleByIdempotencyKeyParams } from "@/feature/pos/types/posSale.dto.types";

type CreatePosCheckoutRepositoryParams = {
  posSaleRepository: PosSaleRepository;
};

export const createPosCheckoutRepository = ({
  posSaleRepository,
}: CreatePosCheckoutRepositoryParams): PosCheckoutRepository => ({
  async getSaleByIdempotencyKey(
    params: GetPosSaleByIdempotencyKeyParams,
  ) {
    return posSaleRepository.getPosSaleByIdempotencyKey(params);
  },
});
