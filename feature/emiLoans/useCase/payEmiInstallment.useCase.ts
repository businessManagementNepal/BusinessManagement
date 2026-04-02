import { EmiOperationResult } from "@/feature/emiLoans/types/emi.entity.types";

export type PayEmiInstallmentInput = {
  planRemoteId: string;
  installmentRemoteId: string;
  paidAt: number;
};

export interface PayEmiInstallmentUseCase {
  execute(input: PayEmiInstallmentInput): Promise<EmiOperationResult>;
}
