import type { PosPaymentPartInput } from "@/feature/pos/types/pos.dto.types";
import type {
  PosCartLine,
  PosCustomer,
  PosReceipt,
  PosTotals,
} from "@/feature/pos/types/pos.entity.types";
import type { PosCheckoutWorkflowStatusValue } from "./posCheckout.state.types";

export type RunPosCheckoutParams = {
  idempotencyKey: string;
  paymentParts: readonly PosPaymentPartInput[];
  selectedCustomer: PosCustomer | null;
  grandTotalSnapshot: number;
  cartLinesSnapshot: readonly PosCartLine[];
  totalsSnapshot: PosTotals;
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
};

export type PosCheckoutPostingReferences = {
  billingDocumentRemoteId: string | null;
  ledgerEntryRemoteId: string | null;
  postedTransactionRemoteIds: readonly string[];
};

export type RunPosCheckoutValue = {
  workflowStatus: PosCheckoutWorkflowStatusValue;
  receipt: PosReceipt | null;
} & PosCheckoutPostingReferences;
