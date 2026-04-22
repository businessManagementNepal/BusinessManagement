import {
    MoneyAccount,
    MoneyAccountType,
} from "@/feature/accounts/types/moneyAccount.types";
import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import { Account } from "@/feature/auth/accountSelection/types/accountSelection.types";
import {
    SaveTransactionPayload,
    TransactionDirection,
    TransactionDirectionValue,
    TransactionType,
    TransactionTypeValue,
} from "@/feature/transactions/types/transaction.entity.types";
import {
    TransactionAccountOption,
    TransactionEditorFieldErrors,
    TransactionEditorState,
    TransactionMoneyAccountOption
} from "@/feature/transactions/types/transaction.state.types";
import { AddTransactionUseCase } from "@/feature/transactions/useCase/addTransaction.useCase";
import { GetTransactionByIdUseCase } from "@/feature/transactions/useCase/getTransactionById.useCase";
import { UpdateTransactionUseCase } from "@/feature/transactions/useCase/updateTransaction.useCase";
import { useCallback, useMemo, useRef, useState } from "react";
import { TransactionEditorViewModel } from "./transactionEditor.viewModel";

const DEFAULT_EDITOR_STATE: TransactionEditorState = {
  visible: false,
  mode: "create",
  remoteId: null,
  type: TransactionType.Income,
  direction: TransactionDirection.In,
  title: "",
  amount: "0",
  accountRemoteId: "",
  settlementMoneyAccountRemoteId: "",
  categoryLabel: "",
  note: "",
  happenedAt: new Date().toISOString().slice(0, 10),
  fieldErrors: {},
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

const mapMoneyAccountToOption = (
  moneyAccount: MoneyAccount,
): TransactionMoneyAccountOption => {
  const accountTypeLabel =
    moneyAccount.type === MoneyAccountType.Cash
      ? "Cash"
      : moneyAccount.type === MoneyAccountType.Bank
        ? "Bank"
        : "Wallet";
  const primaryLabel = moneyAccount.isPrimary ? " (Primary)" : "";

  return {
    remoteId: moneyAccount.remoteId,
    label: `${moneyAccount.name} | ${accountTypeLabel}${primaryLabel}`,
  };
};

const clearFieldError = (
  fieldErrors: TransactionEditorFieldErrors,
  field: keyof TransactionEditorFieldErrors,
): TransactionEditorFieldErrors => {
  if (!fieldErrors[field]) {
    return fieldErrors;
  }

  return {
    ...fieldErrors,
    [field]: undefined,
  };
};

const validateTransactionEditorState = ({
  mode,
  accountRemoteId,
  settlementMoneyAccountRemoteId,
  selectedAccountExists,
  selectedMoneyAccountExists,
  amount,
  happenedAt,
}: {
  mode: "create" | "edit";
  accountRemoteId: string;
  settlementMoneyAccountRemoteId: string;
  selectedAccountExists: boolean;
  selectedMoneyAccountExists: boolean;
  amount: string;
  happenedAt: string;
}): TransactionEditorFieldErrors => {
  const nextFieldErrors: TransactionEditorFieldErrors = {};
  const parsedAmount = Number(amount.replace(/,/g, "").trim());
  const parsedDate = parseDateInput(happenedAt);

  if (!selectedAccountExists) {
    nextFieldErrors.accountRemoteId = "Please select an account.";
  }

  if (mode === "create" && settlementMoneyAccountRemoteId.trim().length === 0) {
    nextFieldErrors.settlementMoneyAccountRemoteId =
      "Please select a money account.";
  }

  if (
    settlementMoneyAccountRemoteId.trim().length > 0 &&
    !selectedMoneyAccountExists
  ) {
    nextFieldErrors.settlementMoneyAccountRemoteId =
      "Please select a valid money account.";
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    nextFieldErrors.amount = "Amount must be greater than zero.";
  }

  if (parsedDate === null) {
    nextFieldErrors.happenedAt =
      "Please enter a valid date in YYYY-MM-DD format.";
  }

  return nextFieldErrors;
};

type UseTransactionEditorViewModelParams = {
  ownerUserRemoteId: string;
  accounts: readonly Account[];
  activeAccountRemoteId: string | null;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  getTransactionByIdUseCase: GetTransactionByIdUseCase;
  addTransactionUseCase: AddTransactionUseCase;
  updateTransactionUseCase: UpdateTransactionUseCase;
  onSaved: () => void;
};

export const useTransactionEditorViewModel = ({
  ownerUserRemoteId,
  accounts,
  activeAccountRemoteId,
  getMoneyAccountsUseCase,
  getTransactionByIdUseCase,
  addTransactionUseCase,
  updateTransactionUseCase,
  onSaved,
}: UseTransactionEditorViewModelParams): TransactionEditorViewModel => {
  const [state, setState] =
    useState<TransactionEditorState>(DEFAULT_EDITOR_STATE);
  const [moneyAccountOptions, setMoneyAccountOptions] = useState<
    readonly TransactionMoneyAccountOption[]
  >([]);
  const moneyAccountLoadRequestIdRef = useRef(0);

  const accountOptions = useMemo<readonly TransactionAccountOption[]>(() => {
    return accounts.map((account) => ({
      remoteId: account.remoteId,
      label: account.displayName,
      currencyCode: account.currencyCode,
    }));
  }, [accounts]);

  const loadMoneyAccountOptions = useCallback(
    async ({
      accountRemoteId,
      preferredSettlementMoneyAccountRemoteId,
      allowAutoSelect,
    }: {
      accountRemoteId: string;
      preferredSettlementMoneyAccountRemoteId?: string | null;
      allowAutoSelect: boolean;
    }) => {
      const normalizedAccountRemoteId = accountRemoteId.trim();
      const requestId = moneyAccountLoadRequestIdRef.current + 1;
      moneyAccountLoadRequestIdRef.current = requestId;

      if (!normalizedAccountRemoteId) {
        setMoneyAccountOptions([]);
        setState((currentState) => ({
          ...currentState,
          settlementMoneyAccountRemoteId: "",
        }));
        return;
      }

      const result = await getMoneyAccountsUseCase.execute(normalizedAccountRemoteId);

      if (moneyAccountLoadRequestIdRef.current !== requestId) {
        return;
      }

      if (!result.success) {
        setMoneyAccountOptions([]);
        setState((currentState) => {
          if (currentState.accountRemoteId !== normalizedAccountRemoteId) {
            return currentState;
          }

          return {
            ...currentState,
            settlementMoneyAccountRemoteId: "",
          };
        });
        return;
      }

      const options = result.value
        .filter((moneyAccount) => moneyAccount.isActive)
        .sort((left, right) => {
          if (left.isPrimary && !right.isPrimary) return -1;
          if (!left.isPrimary && right.isPrimary) return 1;
          return left.name.localeCompare(right.name);
        })
        .map(mapMoneyAccountToOption);

      setMoneyAccountOptions(options);
      setState((currentState) => {
        if (currentState.accountRemoteId !== normalizedAccountRemoteId) {
          return currentState;
        }

        const preferredRemoteId =
          preferredSettlementMoneyAccountRemoteId?.trim() ?? "";
        const nextSettlementMoneyAccountRemoteId = options.some(
          (option) => option.remoteId === preferredRemoteId,
        )
          ? preferredRemoteId
          : allowAutoSelect
            ? (options[0]?.remoteId ?? "")
            : "";

        if (
          currentState.settlementMoneyAccountRemoteId ===
          nextSettlementMoneyAccountRemoteId
        ) {
          return currentState;
        }

        return {
          ...currentState,
          settlementMoneyAccountRemoteId: nextSettlementMoneyAccountRemoteId,
        };
      });
    },
    [getMoneyAccountsUseCase],
  );

  const openCreate = useCallback(
    (type: TransactionTypeValue) => {
      const preferredAccountRemoteId =
        activeAccountRemoteId ?? accountOptions[0]?.remoteId ?? "";

      setState({
        ...DEFAULT_EDITOR_STATE,
        visible: true,
        mode: "create",
        type,
        direction: deriveDirectionFromType(
          type,
          DEFAULT_EDITOR_STATE.direction,
        ),
        accountRemoteId: preferredAccountRemoteId,
        happenedAt: new Date().toISOString().slice(0, 10),
      });
      void loadMoneyAccountOptions({
        accountRemoteId: preferredAccountRemoteId,
        allowAutoSelect: true,
      });
    },
    [accountOptions, activeAccountRemoteId, loadMoneyAccountOptions],
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
        settlementMoneyAccountRemoteId:
          result.value.settlementMoneyAccountRemoteId ?? "",
        categoryLabel: result.value.categoryLabel ?? "",
        note: result.value.note ?? "",
        happenedAt: formatDateInput(result.value.happenedAt),
        fieldErrors: {},
        errorMessage: null,
        isSaving: false,
      });
      void loadMoneyAccountOptions({
        accountRemoteId: result.value.accountRemoteId,
        preferredSettlementMoneyAccountRemoteId:
          result.value.settlementMoneyAccountRemoteId,
        allowAutoSelect: false,
      });
    },
    [getTransactionByIdUseCase, loadMoneyAccountOptions],
  );

  const close = useCallback(() => {
    moneyAccountLoadRequestIdRef.current += 1;
    setMoneyAccountOptions([]);
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

  const handleChangeDirection = useCallback(
    (direction: TransactionDirectionValue) => {
      setState((currentState) => ({
        ...currentState,
        direction,
        errorMessage: null,
      }));
    },
    [],
  );

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
      fieldErrors: clearFieldError(currentState.fieldErrors, "amount"),
      errorMessage: null,
    }));
  }, []);

  const handleChangeAccountRemoteId = useCallback(
    (accountRemoteId: string) => {
      setState((currentState) => ({
        ...currentState,
        accountRemoteId,
        settlementMoneyAccountRemoteId: "",
        fieldErrors: {
          ...clearFieldError(currentState.fieldErrors, "accountRemoteId"),
          settlementMoneyAccountRemoteId: undefined,
        },
        errorMessage: null,
      }));
      void loadMoneyAccountOptions({
        accountRemoteId,
        allowAutoSelect: true,
      });
    },
    [loadMoneyAccountOptions],
  );

  const handleChangeSettlementMoneyAccountRemoteId = useCallback(
    (settlementMoneyAccountRemoteId: string) => {
      setState((currentState) => ({
        ...currentState,
        settlementMoneyAccountRemoteId,
        fieldErrors: clearFieldError(
          currentState.fieldErrors,
          "settlementMoneyAccountRemoteId",
        ),
        errorMessage: null,
      }));
    },
    [],
  );

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
      fieldErrors: clearFieldError(currentState.fieldErrors, "happenedAt"),
      errorMessage: null,
    }));
  }, []);

  const submit = useCallback(async () => {
    const selectedAccount = accountOptions.find(
      (accountOption) => accountOption.remoteId === state.accountRemoteId,
    );
    const selectedMoneyAccount = moneyAccountOptions.find(
      (option) => option.remoteId === state.settlementMoneyAccountRemoteId,
    );
    const parsedAmount = Number(state.amount.replace(/,/g, "").trim());
    const parsedDate = parseDateInput(state.happenedAt);

    const nextFieldErrors = validateTransactionEditorState({
      mode: state.mode,
      accountRemoteId: state.accountRemoteId,
      settlementMoneyAccountRemoteId: state.settlementMoneyAccountRemoteId,
      selectedAccountExists: Boolean(selectedAccount),
      selectedMoneyAccountExists:
        state.settlementMoneyAccountRemoteId.trim().length === 0
          ? true
          : Boolean(selectedMoneyAccount),
      amount: state.amount,
      happenedAt: state.happenedAt,
    });

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setState((currentState) => ({
        ...currentState,
        fieldErrors: nextFieldErrors,
        errorMessage: null,
      }));
      return;
    }

    // At this point, selectedAccount is guaranteed to exist due to validation
    const payload: SaveTransactionPayload = {
      remoteId: state.remoteId ?? createTransactionRemoteId(),
      ownerUserRemoteId,
      accountRemoteId: selectedAccount!.remoteId,
      accountDisplayNameSnapshot: selectedAccount!.label,
      transactionType: state.type,
      direction: state.direction,
      title: state.title,
      amount: parsedAmount,
      currencyCode: selectedAccount!.currencyCode,
      categoryLabel: state.categoryLabel,
      note: state.note,
      happenedAt: parsedDate!,
      settlementMoneyAccountRemoteId: selectedMoneyAccount?.remoteId ?? null,
      settlementMoneyAccountDisplayNameSnapshot:
        selectedMoneyAccount?.label ?? null,
    };

    setState((currentState) => ({
      ...currentState,
      isSaving: true,
      fieldErrors: {},
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
    moneyAccountOptions,
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
    state.settlementMoneyAccountRemoteId,
    state.title,
    state.type,
    updateTransactionUseCase,
  ]);

  const availableTypes = useMemo(
    () =>
      [
        { value: TransactionType.Income, label: "Income" },
        { value: TransactionType.Expense, label: "Expense" },
        { value: TransactionType.Transfer, label: "Transfer" },
        { value: TransactionType.Refund, label: "Refund" },
      ] as const,
    [],
  );

  const availableDirections = useMemo(
    () =>
      [
        { value: TransactionDirection.In, label: "Money In" },
        { value: TransactionDirection.Out, label: "Money Out" },
      ] as const,
    [],
  );

  return useMemo(
    () => ({
      state,
      accountOptions,
      moneyAccountOptions,
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
      onChangeSettlementMoneyAccountRemoteId:
        handleChangeSettlementMoneyAccountRemoteId,
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
      handleChangeSettlementMoneyAccountRemoteId,
      handleChangeTitle,
      handleChangeType,
      moneyAccountOptions,
      openCreate,
      openEdit,
      state,
      submit,
    ],
  );
};
