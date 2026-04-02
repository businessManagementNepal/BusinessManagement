import { EmiPlanDetailResult } from "@/feature/emiLoans/types/emi.entity.types";

export interface GetEmiPlanByRemoteIdUseCase {
  execute(remoteId: string): Promise<EmiPlanDetailResult>;
}
