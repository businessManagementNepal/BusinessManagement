import type { PosPaymentPartInput } from "@/feature/pos/types/pos.dto.types";
import type {
  PosCartLine,
  PosReceipt,
  PosTotals,
} from "@/feature/pos/types/pos.entity.types";
import type { PosSaleWorkflowStatusValue } from "./posSale.constant";

export type PosSaleRecord = {
  remoteId: string;
  receiptNumber: string;
  businessAccountRemoteId: string;
  ownerUserRemoteId: string;
  idempotencyKey: string;
  workflowStatus: PosSaleWorkflowStatusValue;
  customerRemoteId: string | null;
  customerNameSnapshot: string | null;
  customerPhoneSnapshot: string | null;
  currencyCode: string;
  countryCode: string | null;
  cartLinesSnapshot: readonly PosCartLine[];
  totalsSnapshot: PosTotals;
  paymentParts: readonly PosPaymentPartInput[];
  receipt: PosReceipt | null;
  billingDocumentRemoteId: string | null;
  ledgerEntryRemoteId: string | null;
  postedTransactionRemoteIds: readonly string[];
  lastErrorType: string | null;
  lastErrorMessage: string | null;
  createdAt: number;
  updatedAt: number;
};
