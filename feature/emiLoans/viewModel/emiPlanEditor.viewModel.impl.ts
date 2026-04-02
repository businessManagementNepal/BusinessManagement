import { useCallback, useMemo, useState } from "react";
import { AddEmiPlanUseCase } from "@/feature/emiLoans/useCase/addEmiPlan.useCase";
import {
  EmiPlanMode,
  EmiPlanModeValue,
  EmiPlanType,
  EmiPlanTypeValue,
} from "@/feature/emiLoans/types/emi.entity.types";
import { EmiPlanEditorState } from "@/feature/emiLoans/types/emi.state.types";
import { parseDateInput } from "./emi.shared";
import { EmiPlanEditorViewModel } from "./emiPlanEditor.viewModel";

type UseEmiPlanEditorViewModelParams = {
  planMode: EmiPlanModeValue;
  ownerUserRemoteId: string | null;
  businessAccountRemoteId: string | null;
  linkedAccountRemoteId: string | null;
  linkedAccountDisplayName: string;
  currencyCode: string | null;
  addEmiPlanUseCase: AddEmiPlanUseCase;
  onSaved: () => void;
};

const getDefaultPlanType = (planMode: EmiPlanModeValue): EmiPlanTypeValue => {
  if (planMode === EmiPlanMode.Business) {
    return EmiPlanType.BusinessLoan;
  }

  return EmiPlanType.MyEmi;
};

const getInitialState = (planMode: EmiPlanModeValue): EmiPlanEditorState => ({
  visible: false,
  planMode,
  planType: getDefaultPlanType(planMode),
  title: "",
  counterpartyName: "",
  counterpartyPhone: "",
  totalAmount: "",
  installmentCount: "",
  firstDueAt: "",
  reminderEnabled: true,
  reminderDaysBefore: "1",
  note: "",
  errorMessage: null,
  isSaving: false,
});

export const useEmiPlanEditorViewModel = ({
  planMode,
  ownerUserRemoteId,
  businessAccountRemoteId,
  linkedAccountRemoteId,
  linkedAccountDisplayName,
  currencyCode,
  addEmiPlanUseCase,
  onSaved,
}: UseEmiPlanEditorViewModelParams): EmiPlanEditorViewModel => {
  const [state, setState] = useState<EmiPlanEditorState>(getInitialState(planMode));

  const availablePlanTypes = useMemo(() => {
    if (planMode === EmiPlanMode.Business) {
      return [
        { value: EmiPlanType.BusinessLoan, label: "Business Loan" },
        { value: EmiPlanType.CustomerInstallment, label: "Installment Plan" },
      ] as const;
    }

    return [
      { value: EmiPlanType.MyEmi, label: "My EMI" },
      { value: EmiPlanType.MyLoan, label: "My Loan" },
    ] as const;
  }, [planMode]);

  const resetState = useCallback(() => {
    setState(getInitialState(planMode));
  }, [planMode]);

  const openCreate = useCallback(() => {
    setState(getInitialState(planMode));
    setState((currentState) => ({ ...currentState, visible: true }));
  }, [planMode]);

  const close = useCallback(() => {
    resetState();
  }, [resetState]);

  const submit = useCallback(async () => {
    const parsedTotalAmount = Number(state.totalAmount.trim());
    const parsedInstallmentCount = Number(state.installmentCount.trim());
    const firstDueAt = parseDateInput(state.firstDueAt);

    if (!ownerUserRemoteId?.trim()) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "User context is missing.",
      }));
      return;
    }

    if (!linkedAccountRemoteId?.trim()) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Active account context is missing.",
      }));
      return;
    }

    if (firstDueAt === null) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Please enter the first due date in YYYY-MM-DD format.",
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      isSaving: true,
      errorMessage: null,
    }));

    const result = await addEmiPlanUseCase.execute({
      ownerUserRemoteId,
      businessAccountRemoteId,
      linkedAccountRemoteId,
      linkedAccountDisplayNameSnapshot: linkedAccountDisplayName,
      currencyCode,
      planMode,
      planType: state.planType,
      title: state.title,
      counterpartyName: state.counterpartyName || null,
      counterpartyPhone: state.counterpartyPhone || null,
      totalAmount: parsedTotalAmount,
      installmentCount: parsedInstallmentCount,
      firstDueAt,
      reminderEnabled: state.reminderEnabled,
      reminderDaysBefore: state.reminderEnabled
        ? Number(state.reminderDaysBefore || "1")
        : null,
      note: state.note || null,
    });

    if (!result.success) {
      setState((currentState) => ({
        ...currentState,
        isSaving: false,
        errorMessage: result.error.message,
      }));
      return;
    }

    onSaved();
    resetState();
  }, [
    addEmiPlanUseCase,
    businessAccountRemoteId,
    currencyCode,
    linkedAccountDisplayName,
    linkedAccountRemoteId,
    onSaved,
    ownerUserRemoteId,
    planMode,
    resetState,
    state.counterpartyName,
    state.counterpartyPhone,
    state.firstDueAt,
    state.installmentCount,
    state.note,
    state.planType,
    state.reminderDaysBefore,
    state.reminderEnabled,
    state.title,
    state.totalAmount,
  ]);

  return {
    state,
    availablePlanTypes,
    accountLabel: linkedAccountDisplayName,
    openCreate,
    close,
    onChangePlanType: (value) =>
      setState((currentState) => ({ ...currentState, planType: value, errorMessage: null })),
    onChangeTitle: (value) =>
      setState((currentState) => ({ ...currentState, title: value, errorMessage: null })),
    onChangeCounterpartyName: (value) =>
      setState((currentState) => ({
        ...currentState,
        counterpartyName: value,
        errorMessage: null,
      })),
    onChangeCounterpartyPhone: (value) =>
      setState((currentState) => ({
        ...currentState,
        counterpartyPhone: value,
        errorMessage: null,
      })),
    onChangeTotalAmount: (value) =>
      setState((currentState) => ({ ...currentState, totalAmount: value, errorMessage: null })),
    onChangeInstallmentCount: (value) =>
      setState((currentState) => ({
        ...currentState,
        installmentCount: value,
        errorMessage: null,
      })),
    onChangeFirstDueAt: (value) =>
      setState((currentState) => ({
        ...currentState,
        firstDueAt: value,
        errorMessage: null,
      })),
    onToggleReminder: () =>
      setState((currentState) => ({
        ...currentState,
        reminderEnabled: !currentState.reminderEnabled,
        errorMessage: null,
      })),
    onChangeReminderDaysBefore: (value) =>
      setState((currentState) => ({
        ...currentState,
        reminderDaysBefore: value,
        errorMessage: null,
      })),
    onChangeNote: (value) =>
      setState((currentState) => ({ ...currentState, note: value, errorMessage: null })),
    submit,
  };
};
