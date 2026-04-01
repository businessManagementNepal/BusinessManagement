import { useCallback, useMemo, useState } from "react";
import { Account } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import {
  AddTransactionUseCase,
} from "@/feature/transactions/useCase/addTransaction.useCase";
import { GetTransactionByIdUseCase } from "@/feature/transactions/useCase/getTransactionById.useCase";
import { UpdateTransactionUseCase } from "@/feature/transactions/useCase/updateTransaction.useCase";
import {
  SaveTransactionPayload,
  TransactionDirection,
  TransactionDirectionValue,
  TransactionType,
  TransactionTypeValue,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  TransactionAccountOption,
  TransactionEditorState,
} from "@/feature/transactions/types/transaction.state.types";
import { TransactionEditorViewModel } from "./transactionEditor.viewModel";

const DEFAULT_EDITOR_STATE: TransactionEditorState = {
  visible: false,
  mode: "create",
  remoteId: null,
  type: TransactionType.Income,
  direction: TransactionDirection.In,
  title: "",
  amount: "",
  accountRemoteId: "",
  categoryLabel: "",
  note: "",
  happenedAt: new Date().toISOString().slice(0, 10),
  errorMessage: null,
  isSaving: false,
};

const createTransactionRemoteId = (): string => {
  return `txn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const deriveDirectionFromType = (
  type: TransactionTypeValue,
  currentDirection: TransactionDirectionValue,
): TransactionDirectionValue => {
  if (type === TransactionType.Income) {
    return TransactionDirection.In;
  }

  if (type === TransactionType.Expense) {
    return TransactionDirection.Out;
  }

  return currentDirection;
};

const formatDateInput = (timestamp: number): string => {
  return new Date(timestamp).toISOString().slice(0, 10);
};

const parseDateInput = (value: string): number | null => {
  const normalizedValue = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return null;
  }

  const parsedDate = new Date(`${normalizedValue}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.getTime();
};

type UseTransactionEditorViewModelParams = {
  ownerUserRemoteId: string;
  accounts: readonly Account[];
  activeAccountRemoteId: string | null;
  getTransactionByIdUseCase: GetTransactionByIdUseCase;
  addTransactionUseCase: AddTransactionUseCase;
  updateTransactionUseCase: UpdateTransactionUseCase;
  onSaved: () => void;
};

export const useTransactionEditorViewModel = ({
  ownerUserRemoteId,
  accounts,
  activeAccountRemoteId,
  getTransactionByIdUseCase,
  addTransactionUseCase,
  updateTransactionUseCase,
  onSaved,
}: UseTransactionEditorViewModelParams): TransactionEditorViewModel => {
  const [state, setState] = useState<TransactionEditorState>(DEFAULT_EDITOR_STATE);

  const accountOptions = useMemo<readonly TransactionAccountOption[]>(() => {
    return accounts.map((account) => ({
      remoteId: account.remoteId,
      label: account.displayName,
      currencyCode: account.currencyCode,
    }));
  }, [accounts]);

  const openCreate = useCallback(
    (type: TransactionTypeValue) => {
      const preferredAccountRemoteId =
        activeAccountRemoteId ?? accountOptions[0]?.remoteId ?? "";

      setState({
        ...DEFAULT_EDITOR_STATE,
        visible: true,
        mode: "create",
        type,
        direction: deriveDirectionFromType(type, DEFAULT_EDITOR_STATE.direction),
        accountRemoteId: preferredAccountRemoteId,
        happenedAt: new Date().toISOString().slice(0, 10),
      });
    },
    [accountOptions, activeAccountRemoteId],
  );

  const openEdit = useCallback(
    async (remoteId: string) => {
      const result = await getTransactionByIdUseCase.execute(remoteId);

      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          visible: true,
          mode: "edit",
          remoteId,
          errorMessage: result.error.message,
        }));
        return;
      }

      setState({
        visible: true,
        mode: "edit",
        remoteId: result.value.remoteId,
        type: result.value.transactionType,
        direction: result.value.direction,
        title: result.value.title,
        amount: String(result.value.amount),
        accountRemoteId: result.value.accountRemoteId,
        categoryLabel: result.value.categoryLabel ?? "",
        note: result.value.note ?? "",
        happenedAt: formatDateInput(result.value.happenedAt),
        errorMessage: null,
        isSaving: false,
      });
    },
    [getTransactionByIdUseCase],
  );

  const close = useCallback(() => {
    setState(DEFAULT_EDITOR_STATE);
  }, []);

  const handleChangeType = useCallback((type: TransactionTypeValue) => {
    setState((currentState) => ({
      ...currentState,
      type,
      direction: deriveDirectionFromType(type, currentState.direction),
      errorMessage: null,
    }));
  }, []);

  const handleChangeDirection = useCallback((direction: TransactionDirectionValue) => {
    setState((currentState) => ({
      ...currentState,
      direction,
      errorMessage: null,
    }));
  }, []);

  const handleChangeTitle = useCallback((title: string) => {
    setState((currentState) => ({
      ...currentState,
      title,
      errorMessage: null,
    }));
  }, []);

  const handleChangeAmount = useCallback((amount: string) => {
    setState((currentState) => ({
      ...currentState,
      amount,
      errorMessage: null,
    }));
  }, []);

  const handleChangeAccountRemoteId = useCallback((accountRemoteId: string) => {
    setState((currentState) => ({
      ...currentState,
      accountRemoteId,
      errorMessage: null,
    }));
  }, []);

  const handleChangeCategoryLabel = useCallback((categoryLabel: string) => {
    setState((currentState) => ({
      ...currentState,
      categoryLabel,
      errorMessage: null,
    }));
  }, []);

  const handleChangeNote = useCallback((note: string) => {
    setState((currentState) => ({
      ...currentState,
      note,
      errorMessage: null,
    }));
  }, []);

  const handleChangeHappenedAt = useCallback((happenedAt: string) => {
    setState((currentState) => ({
      ...currentState,
      happenedAt,
      errorMessage: null,
    }));
  }, []);

  const submit = useCallback(async () => {
    const selectedAccount = accountOptions.find(
      (accountOption) => accountOption.remoteId === state.accountRemoteId,
    );

    const parsedAmount = Number(state.amount.replace(/,/g, "").trim());
    const parsedDate = parseDateInput(state.happenedAt);

    if (!selectedAccount) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Please select an account.",
      }));
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Amount must be greater than zero.",
      }));
      return;
    }

    if (!parsedDate) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Please enter a valid date in YYYY-MM-DD format.",
      }));
      return;
    }

    const payload: SaveTransactionPayload = {
      remoteId: state.remoteId ?? createTransactionRemoteId(),
      ownerUserRemoteId,
      accountRemoteId: selectedAccount.remoteId,
      accountDisplayNameSnapshot: selectedAccount.label,
      transactionType: state.type,
      direction: state.direction,
      title: state.title,
      amount: parsedAmount,
      currencyCode: selectedAccount.currencyCode,
      categoryLabel: state.categoryLabel,
      note: state.note,
      happenedAt: parsedDate,
    };

    setState((currentState) => ({
      ...currentState,
      isSaving: true,
      errorMessage: null,
    }));

    const result =
      state.mode === "create"
        ? await addTransactionUseCase.execute(payload)
        : await updateTransactionUseCase.execute(payload);

    if (!result.success) {
      setState((currentState) => ({
        ...currentState,
        isSaving: false,
        errorMessage: result.error.message,
      }));
      return;
    }

    close();
    onSaved();
  }, [
    accountOptions,
    addTransactionUseCase,
    close,
    onSaved,
    ownerUserRemoteId,
    state.accountRemoteId,
    state.amount,
    state.categoryLabel,
    state.direction,
    state.happenedAt,
    state.mode,
    state.note,
    state.remoteId,
    state.title,
    state.type,
    updateTransactionUseCase,
  ]);

  const availableTypes = useMemo(
    () => [
      { value: TransactionType.Income, label: "Income" },
      { value: TransactionType.Expense, label: "Expense" },
      { value: TransactionType.Transfer, label: "Transfer" },
      { value: TransactionType.Refund, label: "Refund" },
    ] as const,
    [],
  );

  const availableDirections = useMemo(
    () => [
      { value: TransactionDirection.In, label: "Money In" },
      { value: TransactionDirection.Out, label: "Money Out" },
    ] as const,
    [],
  );

  return useMemo(
    () => ({
      state,
      accountOptions,
      availableTypes,
      availableDirections,
      openCreate,
      openEdit,
      close,
      onChangeType: handleChangeType,
      onChangeDirection: handleChangeDirection,
      onChangeTitle: handleChangeTitle,
      onChangeAmount: handleChangeAmount,
      onChangeAccountRemoteId: handleChangeAccountRemoteId,
      onChangeCategoryLabel: handleChangeCategoryLabel,
      onChangeNote: handleChangeNote,
      onChangeHappenedAt: handleChangeHappenedAt,
      submit,
    }),
    [
      accountOptions,
      availableDirections,
      availableTypes,
      close,
      handleChangeAccountRemoteId,
      handleChangeAmount,
      handleChangeCategoryLabel,
      handleChangeDirection,
      handleChangeHappenedAt,
      handleChangeNote,
      handleChangeTitle,
      handleChangeType,
      openCreate,
      openEdit,
      state,
      submit,
    ],
  );
};
