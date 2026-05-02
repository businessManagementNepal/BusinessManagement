import { Result } from "@/shared/types/result.types";

export type RecalculateMoneyAccountBalancesInput = {
  accountRemoteId: string;
};

export interface RecalculateMoneyAccountBalancesUseCase {
  execute(
    input: RecalculateMoneyAccountBalancesInput,
  ): Promise<Result<boolean>>;
}
