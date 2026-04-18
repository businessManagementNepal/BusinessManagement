import type { PosPaymentPartInput } from "../types/pos.dto.types";
import type { PosCartLine, PosReceipt, PosTotals } from "../types/pos.entity.types";
import type { PosSaleResult } from "../types/posSale.error.types";
import type { PosSaleRepository } from "../data/repository/posSale.repository";

export type CreatePosSaleDraftParams = {
  remoteId: string;
  receiptNumber: string;
  businessAccountRemoteId: string;
  ownerUserRemoteId: string;
  idempotencyKey: string;
  customerRemoteId: string | null;
  customerNameSnapshot: string | null;
  customerPhoneSnapshot: string | null;
  currencyCode: string;
  countryCode: string | null;
  cartLinesSnapshot: readonly PosCartLine[];
  totalsSnapshot: PosTotals;
  paymentParts: readonly PosPaymentPartInput[];
  receipt: PosReceipt | null;
};

export type CreatePosSaleDraftRepository = Pick<
  PosSaleRepository,
  "createPosSaleRecord"
>;

export interface CreatePosSaleDraftUseCase {
  execute(params: CreatePosSaleDraftParams): Promise<PosSaleResult>;
}
