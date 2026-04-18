import type { RunPosCheckoutResult } from "../types/posCheckout.error.types";
import type { RunPosCheckoutParams } from "../types/posCheckout.types";

export interface RunPosCheckoutUseCase {
  execute(params: RunPosCheckoutParams): Promise<RunPosCheckoutResult>;
}
