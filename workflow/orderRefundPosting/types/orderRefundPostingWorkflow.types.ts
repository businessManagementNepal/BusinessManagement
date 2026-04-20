import { OrderError } from "@/feature/orders/types/order.types";
import { Result } from "@/shared/types/result.types";

export type OrderRefundPostingWorkflowInput = {
  orderRemoteId: string;
  orderNumber: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  accountDisplayNameSnapshot: string;
  currencyCode: string | null;
  amount: number;
  happenedAt: number;
  settlementMoneyAccountRemoteId: string;
  settlementMoneyAccountDisplayNameSnapshot: string;
  note: string | null;
  refundAttemptRemoteId: string;
};

export type OrderRefundPostingWorkflowValue = {
  orderRemoteId: string;
  refundTransactionRemoteId: string;
  refundSettlementLedgerEntryRemoteId: string;
  refundBillingDocumentRemoteId: string;
  originalDueEntryRemoteId: string;
};

export type OrderRefundPostingWorkflowResult = Result<
  OrderRefundPostingWorkflowValue,
  OrderError
>;
