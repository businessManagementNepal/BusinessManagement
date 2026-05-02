import { Result } from "@/shared/types/result.types";

export type RecalculateStockProjectionInput = {
  accountRemoteId: string;
};

export interface RecalculateStockProjectionUseCase {
  execute(input: RecalculateStockProjectionInput): Promise<Result<boolean>>;
}
