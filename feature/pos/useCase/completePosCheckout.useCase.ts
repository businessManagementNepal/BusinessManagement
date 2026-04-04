import { PosCompletePaymentParams } from "../types/pos.dto.types";
import { PosPaymentResult } from "../types/pos.error.types";

export type CompletePosCheckoutParams = PosCompletePaymentParams & {
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
};

export interface CompletePosCheckoutUseCase {
  execute(params: CompletePosCheckoutParams): Promise<PosPaymentResult>;
}
