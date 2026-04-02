import {
  CompleteInstallmentPaymentPayload,
  EmiOperationResult,
  EmiPlanDetailResult,
  EmiPlanResult,
  EmiPlansResult,
  SaveEmiInstallmentPayload,
  SaveEmiPlanPayload,
} from "@/feature/emiLoans/types/emi.entity.types";

export interface EmiRepository {
  savePlanWithInstallments(
    plan: SaveEmiPlanPayload,
    installments: readonly SaveEmiInstallmentPayload[],
  ): Promise<EmiPlanResult>;
  getPersonalPlansByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<EmiPlansResult>;
  getBusinessPlansByBusinessAccountRemoteId(
    businessAccountRemoteId: string,
  ): Promise<EmiPlansResult>;
  getPlanDetailByRemoteId(remoteId: string): Promise<EmiPlanDetailResult>;
  completeInstallmentPayment(
    payload: CompleteInstallmentPaymentPayload,
  ): Promise<EmiOperationResult>;
}
