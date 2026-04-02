import { Result } from "@/shared/types/result.types";
import {
  CompleteInstallmentPaymentPayload,
  EmiInstallment,
  SaveEmiInstallmentPayload,
  SaveEmiPlanPayload,
} from "@/feature/emiLoans/types/emi.entity.types";
import { EmiPlanModel } from "./db/emiPlan.model";
import { EmiInstallmentModel } from "./db/emiInstallment.model";

export interface EmiDatasource {
  savePlanWithInstallments(
    plan: SaveEmiPlanPayload,
    installments: readonly SaveEmiInstallmentPayload[],
  ): Promise<Result<EmiPlanModel>>;
  getPlansByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<Result<EmiPlanModel[]>>;
  getPlansByBusinessAccountRemoteId(
    businessAccountRemoteId: string,
  ): Promise<Result<EmiPlanModel[]>>;
  getPlanByRemoteId(remoteId: string): Promise<Result<EmiPlanModel | null>>;
  getInstallmentsByPlanRemoteId(
    planRemoteId: string,
  ): Promise<Result<EmiInstallmentModel[]>>;
  completeInstallmentPayment(
    payload: CompleteInstallmentPaymentPayload,
  ): Promise<Result<boolean>>;
}
