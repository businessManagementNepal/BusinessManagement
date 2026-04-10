import {
    BillingDocumentTypeValue,
    BillingOperationResult,
} from "@/feature/billing/types/billing.types";

export type PayBillingDocumentPayload = {
  billingDocumentRemoteId: string;
  accountRemoteId: string;
  accountDisplayNameSnapshot: string;
  ownerUserRemoteId: string;
  settlementMoneyAccountRemoteId: string;
  settlementMoneyAccountDisplayNameSnapshot: string;
  amount: number;
  settledAt: number;
  note: string | null;
  documentType: BillingDocumentTypeValue;
  documentNumber: string;
};

export interface PayBillingDocumentUseCase {
  execute(payload: PayBillingDocumentPayload): Promise<BillingOperationResult>;
}
