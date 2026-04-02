import { EmiPlanResult } from "@/feature/emiLoans/types/emi.entity.types";

export type AddEmiPlanInput = {
  ownerUserRemoteId: string;
  businessAccountRemoteId: string | null;
  linkedAccountRemoteId: string;
  linkedAccountDisplayNameSnapshot: string;
  currencyCode: string | null;
  planMode: "personal" | "business";
  planType:
    | "my_emi"
    | "my_loan"
    | "business_loan"
    | "customer_installment";
  title: string;
  counterpartyName: string | null;
  counterpartyPhone: string | null;
  totalAmount: number;
  installmentCount: number;
  firstDueAt: number;
  reminderEnabled: boolean;
  reminderDaysBefore: number | null;
  note: string | null;
};

export interface AddEmiPlanUseCase {
  execute(input: AddEmiPlanInput): Promise<EmiPlanResult>;
}
