import { PosCompletePaymentParams } from "../types/pos.dto.types";
import { PosPaymentResult } from "../types/pos.error.types";

export type CompletePosCheckoutParams = PosCompletePaymentParams & {
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  activeSettlementAccountRemoteId?: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  selectedCustomer: import("../types/pos.entity.types").PosCustomer | null;
};

export interface CompletePosCheckoutUseCase {
  execute(params: CompletePosCheckoutParams): Promise<PosPaymentResult>;
}
