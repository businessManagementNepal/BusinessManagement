import type {
  GetPosSalesParams,
  GetPosSalesUseCase,
  PosSalesReaderRepository,
  PosSalesResult,
} from "./getPosSales.useCase";

export const createGetPosSalesUseCase = (
  repository: PosSalesReaderRepository,
): GetPosSalesUseCase => ({
  async execute(params: GetPosSalesParams): Promise<PosSalesResult> {
    return repository.getPosSales(params);
  },
});
