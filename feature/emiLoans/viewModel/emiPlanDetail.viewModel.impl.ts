import { useCallback, useState } from "react";
import { GetEmiPlanByRemoteIdUseCase } from "@/feature/emiLoans/useCase/getEmiPlanByRemoteId.useCase";
import { PayEmiInstallmentUseCase } from "@/feature/emiLoans/useCase/payEmiInstallment.useCase";
import { buildEmiPlanDetailState } from "./emi.shared";
import { EmiPlanDetailViewModel } from "./emiPlanDetail.viewModel";

export const useEmiPlanDetailViewModel = (
  getEmiPlanByRemoteIdUseCase: GetEmiPlanByRemoteIdUseCase,
  payEmiInstallmentUseCase: PayEmiInstallmentUseCase,
  onChanged: () => void,
): EmiPlanDetailViewModel => {
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [state, setState] = useState<ReturnType<typeof buildEmiPlanDetailState> | null>(null);

  const loadPlan = useCallback(
    async (remoteId: string) => {
      setIsLoading(true);
      const result = await getEmiPlanByRemoteIdUseCase.execute(remoteId);

      if (!result.success) {
        setState(null);
        setErrorMessage(result.error.message);
        setIsLoading(false);
        return;
      }

      setState(buildEmiPlanDetailState(result.value.plan, result.value.installments));
      setErrorMessage(null);
      setIsLoading(false);
    },
    [getEmiPlanByRemoteIdUseCase],
  );

  const open = useCallback(
    async (remoteId: string) => {
      setVisible(true);
      await loadPlan(remoteId);
    },
    [loadPlan],
  );

  const close = useCallback(() => {
    setVisible(false);
    setErrorMessage(null);
  }, []);

  const payInstallment = useCallback(
    async (installmentRemoteId: string) => {
      if (!state) {
        return;
      }

      setIsSubmittingPayment(true);
      const result = await payEmiInstallmentUseCase.execute({
        planRemoteId: state.remoteId,
        installmentRemoteId,
        paidAt: Date.now(),
      });

      if (!result.success) {
        setErrorMessage(result.error.message);
        setIsSubmittingPayment(false);
        return;
      }

      await loadPlan(state.remoteId);
      onChanged();
      setIsSubmittingPayment(false);
    },
    [loadPlan, onChanged, payEmiInstallmentUseCase, state],
  );

  return {
    visible,
    isLoading,
    isSubmittingPayment,
    errorMessage,
    state,
    close,
    open,
    payInstallment,
  };
};
