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
};
