import { PosReceipt } from "../types/pos.entity.types";
import { PosOperationResult } from "../types/pos.error.types";

export type ShareReceiptPayload = {
  receipt: PosReceipt;
  currencyCode: string;
  countryCode: string | null;
};

export interface ShareReceiptUseCase {
  execute(payload: ShareReceiptPayload): Promise<PosOperationResult>;
}
