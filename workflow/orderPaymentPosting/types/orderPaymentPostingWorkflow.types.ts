export type OrderPaymentPostingWorkflowInput = {
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
};

export type OrderPaymentPostingWorkflowValue = {
  orderRemoteId: string;
  paymentTransactionRemoteId: string;
  settlementLedgerEntryRemoteId: string;
  billingDocumentRemoteId: string;
  ledgerDueEntryRemoteId: string;
};

export type OrderPaymentPostingWorkflowResult = {
  success: true;
  value: OrderPaymentPostingWorkflowValue;
} | {
  success: false;
  error: {
    type: "VALIDATION_ERROR" | "BUSINESS_RULE_ERROR" | "SETTLEMENT_ERROR" | "UNKNOWN_ERROR";
    message: string;
  };
};
