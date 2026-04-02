import { EmiPlanDetailState } from "@/feature/emiLoans/types/emi.state.types";

export interface EmiPlanDetailViewModel {
  visible: boolean;
  isLoading: boolean;
  isSubmittingPayment: boolean;
  errorMessage: string | null;
  state: EmiPlanDetailState | null;
  close: () => void;
  open: (remoteId: string) => Promise<void>;
  payInstallment: (installmentRemoteId: string) => Promise<void>;
}
