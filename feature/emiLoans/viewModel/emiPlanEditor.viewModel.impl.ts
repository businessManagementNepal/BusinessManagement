import { useCallback, useMemo, useState } from "react";
import { AddEmiPlanUseCase } from "@/feature/emiLoans/useCase/addEmiPlan.useCase";
import {
  EmiPlanMode,
  EmiPlanModeValue,
  EmiPlanType,
  EmiPlanTypeValue,
} from "@/feature/emiLoans/types/emi.entity.types";
import {
  EmiPlanEditorFieldErrors,
  EmiPlanEditorState,
} from "@/feature/emiLoans/types/emi.state.types";
import { parseDateInput } from "./emi.shared";
import { validateEmiPlanEditorState } from "@/feature/emiLoans/validation/validateEmiPlanEditorState";
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
  fieldErrors: {},
  errorMessage: null,
  isSaving: false,
});

const clearFieldError = (
  fieldErrors: EmiPlanEditorFieldErrors,
  field: keyof EmiPlanEditorFieldErrors,
): EmiPlanEditorFieldErrors => {
  if (!fieldErrors[field]) {
    return fieldErrors;
  }

  return {
    ...fieldErrors,
    [field]: undefined,
  };
};

const parseDecimalInput = (value: string): number => {
  return Number(value.trim().replace(/,/g, ""));
};

const parseIntegerInput = (value: string): number => {
  return Number(value.trim());
};

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
    setState({
      ...getInitialState(planMode),
      visible: true,
    });
  }, [planMode]);

  const close = useCallback(() => {
    resetState();
  }, [resetState]);

  const submit = useCallback(async () => {
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

    const nextFieldErrors = validateEmiPlanEditorState({
      title: state.title,
      totalAmount: state.totalAmount,
      installmentCount: state.installmentCount,
      firstDueAt: state.firstDueAt,
      reminderEnabled: state.reminderEnabled,
      reminderDaysBefore: state.reminderDaysBefore,
    });

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setState((currentState) => ({
        ...currentState,
        fieldErrors: nextFieldErrors,
        errorMessage: null,
      }));
      return;
    }

    const parsedTotalAmount = parseDecimalInput(state.totalAmount);
    const parsedInstallmentCount = parseIntegerInput(state.installmentCount);
    const firstDueAt = parseDateInput(state.firstDueAt);

    if (firstDueAt === null) {
      setState((currentState) => ({
        ...currentState,
        fieldErrors: {
          ...currentState.fieldErrors,
          firstDueAt:
            "Please enter the first due date in YYYY-MM-DD format.",
        },
        errorMessage: null,
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      isSaving: true,
      fieldErrors: {},
      errorMessage: null,
    }));

    const result = await addEmiPlanUseCase.execute({
      ownerUserRemoteId: ownerUserRemoteId.trim(),
      businessAccountRemoteId: businessAccountRemoteId?.trim() || null,
      linkedAccountRemoteId: linkedAccountRemoteId.trim(),
      linkedAccountDisplayNameSnapshot: linkedAccountDisplayName,
      currencyCode,
      planMode,
      planType: state.planType,
      title: state.title.trim(),
      counterpartyName: state.counterpartyName.trim() || null,
      counterpartyPhone: state.counterpartyPhone.trim() || null,
      totalAmount: parsedTotalAmount,
      installmentCount: parsedInstallmentCount,
      firstDueAt,
      reminderEnabled: state.reminderEnabled,
      reminderDaysBefore: state.reminderEnabled
        ? parseIntegerInput(state.reminderDaysBefore)
        : null,
      note: state.note.trim() || null,
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
      setState((currentState) => ({
        ...currentState,
        planType: value,
        errorMessage: null,
      })),
    onChangeTitle: (value) =>
      setState((currentState) => ({
        ...currentState,
        title: value,
        fieldErrors: clearFieldError(currentState.fieldErrors, "title"),
        errorMessage: null,
      })),
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
      setState((currentState) => ({
        ...currentState,
        totalAmount: value,
        fieldErrors: clearFieldError(currentState.fieldErrors, "totalAmount"),
        errorMessage: null,
      })),
    onChangeInstallmentCount: (value) =>
      setState((currentState) => ({
        ...currentState,
        installmentCount: value,
        fieldErrors: clearFieldError(
          currentState.fieldErrors,
          "installmentCount",
        ),
        errorMessage: null,
      })),
    onChangeFirstDueAt: (value) =>
      setState((currentState) => ({
        ...currentState,
        firstDueAt: value,
        fieldErrors: clearFieldError(currentState.fieldErrors, "firstDueAt"),
        errorMessage: null,
      })),
    onToggleReminder: () =>
      setState((currentState) => ({
        ...currentState,
        reminderEnabled: !currentState.reminderEnabled,
        fieldErrors: {
          ...currentState.fieldErrors,
          reminderDaysBefore: undefined,
        },
        errorMessage: null,
      })),
    onChangeReminderDaysBefore: (value) =>
      setState((currentState) => ({
        ...currentState,
        reminderDaysBefore: value,
        fieldErrors: clearFieldError(
          currentState.fieldErrors,
          "reminderDaysBefore",
        ),
        errorMessage: null,
      })),
    onChangeNote: (value) =>
      setState((currentState) => ({
        ...currentState,
        note: value,
        errorMessage: null,
      })),
    submit,
  };
};
