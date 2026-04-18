import type {
  GetPosSaleByIdParams,
  GetPosSaleByIdUseCase,
  PosSaleByIdReaderRepository,
  PosSaleByIdResult,
} from "./getPosSaleById.useCase";

export const createGetPosSaleByIdUseCase = (
  repository: PosSaleByIdReaderRepository,
): GetPosSaleByIdUseCase => ({
  async execute(params: GetPosSaleByIdParams): Promise<PosSaleByIdResult> {
    return repository.getPosSaleById(params);
  },
});
