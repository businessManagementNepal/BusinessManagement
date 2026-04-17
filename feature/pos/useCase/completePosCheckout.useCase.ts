import type { PosPaymentPartInput } from "../types/pos.dto.types";
import type {
  PosCartLine,
  PosCustomer,
  PosTotals,
} from "../types/pos.entity.types";
import type { PosPaymentResult } from "../types/pos.error.types";

export type CompletePosCheckoutParams = {
  paymentParts: readonly PosPaymentPartInput[];
  selectedCustomer: PosCustomer | null;
  grandTotalSnapshot: number;
  cartLinesSnapshot?: readonly PosCartLine[];
  totalsSnapshot?: PosTotals;
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
};

export interface CompletePosCheckoutUseCase {
  execute(params: CompletePosCheckoutParams): Promise<PosPaymentResult>;
}
