import {
  Category,
  CategoryKind,
  CategoryKindValue,
} from "@/feature/categories/types/category.types";
import { GetCategoriesUseCase } from "@/feature/categories/useCase/getCategories.useCase";
import {
  MoneyAccount,
  MoneyAccountType,
} from "@/feature/accounts/types/moneyAccount.types";
import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import {
  Account,
  AccountTypeValue,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import { parseTransactionEditorDateInput, validateTransactionEditorState } from "@/feature/transactions/validation/validateTransactionEditorState";
import {
  SaveTransactionPayload,
  TransactionDirection,
  TransactionDirectionValue,
  TransactionType,
  TransactionTypeValue,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionEditorFieldErrors,
  TransactionEditorState,
  TransactionMoneyAccountOption,
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
  categoryRemoteId: "",
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

const getCategoryKindForTransactionType = (
  transactionType: TransactionTypeValue,
): CategoryKindValue | null => {
  if (transactionType === TransactionType.Income) {
    return CategoryKind.Income;
  }

  if (
    transactionType === TransactionType.Expense ||
    transactionType === TransactionType.Refund
  ) {
    return CategoryKind.Expense;
  }

  return null;
};

const isSelectableTransactionCategory = (
  category: Category,
  transactionType: TransactionTypeValue,
): boolean => {
  const requiredKind = getCategoryKindForTransactionType(transactionType);

  return requiredKind !== null && category.kind === requiredKind;
};

const mapCategoryToOption = (
  category: Category,
): TransactionCategoryOption => ({
  remoteId: category.remoteId,
  label: category.name,
  kind: category.kind,
});

const supportsCategorySelection = (type: TransactionTypeValue): boolean => {
  return type !== TransactionType.Transfer;
};

const normalizeCategoryLabel = (
  value: string | null | undefined,
): string => {
  return value?.trim().toLowerCase() ?? "";
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

type UseTransactionEditorViewModelParams = {
  ownerUserRemoteId: string;
  accounts: readonly Account[];
  activeAccountRemoteId: string | null;
  accountTypeScope: AccountTypeValue;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  getCategoriesUseCase: GetCategoriesUseCase;
  getTransactionByIdUseCase: GetTransactionByIdUseCase;
  addTransactionUseCase: AddTransactionUseCase;
  updateTransactionUseCase: UpdateTransactionUseCase;
  onSaved: (message: string) => void;
};

export const useTransactionEditorViewModel = ({
  ownerUserRemoteId,
  accounts,
  activeAccountRemoteId,
  accountTypeScope,
  getMoneyAccountsUseCase,
  getCategoriesUseCase,
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
  const [categoryOptions, setCategoryOptions] = useState<
    readonly TransactionCategoryOption[]
  >([]);
  const moneyAccountLoadRequestIdRef = useRef(0);
  const categoryLoadRequestIdRef = useRef(0);

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

  const loadCategoryOptions = useCallback(
    async ({
      accountRemoteId,
      transactionType,
      preferredCategoryRemoteId,
      preferredCategoryLabel,
      allowAutoSelect,
    }: {
      accountRemoteId: string;
      transactionType: TransactionTypeValue;
      preferredCategoryRemoteId?: string | null;
      preferredCategoryLabel?: string | null;
      allowAutoSelect: boolean;
    }) => {
      const normalizedAccountRemoteId = accountRemoteId.trim();
      const requestId = categoryLoadRequestIdRef.current + 1;
      categoryLoadRequestIdRef.current = requestId;

      if (
        !normalizedAccountRemoteId ||
        !supportsCategorySelection(transactionType)
      ) {
        setCategoryOptions([]);
        setState((currentState) => ({
          ...currentState,
          categoryRemoteId: "",
          categoryLabel: "",
        }));
        return;
      }

      const result = await getCategoriesUseCase.execute({
        ownerUserRemoteId,
        accountRemoteId: normalizedAccountRemoteId,
        accountType: accountTypeScope,
      });

      if (categoryLoadRequestIdRef.current !== requestId) {
        return;
      }

      if (!result.success) {
        setCategoryOptions([]);
        setState((currentState) => {
          if (
            currentState.accountRemoteId !== normalizedAccountRemoteId ||
            currentState.type !== transactionType
          ) {
            return currentState;
          }

          return {
            ...currentState,
            categoryRemoteId: "",
            categoryLabel: "",
          };
        });
        return;
      }

      const options = result.value
        .filter((category) =>
          isSelectableTransactionCategory(category, transactionType),
        )
        .sort((left, right) => {
          const kindSort = left.kind.localeCompare(right.kind);
          if (kindSort !== 0) {
            return kindSort;
          }

          return left.name.localeCompare(right.name);
        })
        .map(mapCategoryToOption);
      const normalizedPreferredCategoryRemoteId =
        preferredCategoryRemoteId?.trim() ?? "";
      const normalizedPreferredCategoryLabel =
        preferredCategoryLabel?.trim() ?? "";
      const labelMatchedCategoryRemoteId =
        normalizedPreferredCategoryRemoteId.length === 0 &&
        normalizedPreferredCategoryLabel.length > 0
          ? (options.find(
              (option) =>
                normalizeCategoryLabel(option.label) ===
                normalizeCategoryLabel(normalizedPreferredCategoryLabel),
            )?.remoteId ?? "")
          : "";
      const resolvedPreferredCategoryRemoteId =
        normalizedPreferredCategoryRemoteId || labelMatchedCategoryRemoteId;

      if (
        normalizedPreferredCategoryRemoteId &&
        !options.some(
          (option) => option.remoteId === normalizedPreferredCategoryRemoteId,
        )
      ) {
        const fallbackKind =
          getCategoryKindForTransactionType(transactionType) ??
          CategoryKind.Expense;
        options.unshift({
          remoteId: normalizedPreferredCategoryRemoteId,
          label:
            normalizedPreferredCategoryLabel || "Archived Category",
          kind: fallbackKind,
        });
      }

      setCategoryOptions(options);
      setState((currentState) => {
        if (
          currentState.accountRemoteId !== normalizedAccountRemoteId ||
          currentState.type !== transactionType
        ) {
          return currentState;
        }

        const nextCategoryRemoteId = options.some(
          (option) => option.remoteId === resolvedPreferredCategoryRemoteId,
        )
          ? resolvedPreferredCategoryRemoteId
          : allowAutoSelect
            ? (options[0]?.remoteId ?? "")
            : "";
        const selectedCategory = options.find(
          (option) => option.remoteId === nextCategoryRemoteId,
        );
        const nextCategoryLabel = selectedCategory?.label ?? "";

        if (
          currentState.categoryRemoteId === nextCategoryRemoteId &&
          currentState.categoryLabel === nextCategoryLabel
        ) {
          return currentState;
        }

        return {
          ...currentState,
          categoryRemoteId: nextCategoryRemoteId,
          categoryLabel: nextCategoryLabel,
        };
      });
    },
    [accountTypeScope, getCategoriesUseCase, ownerUserRemoteId],
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
        categoryRemoteId: "",
        categoryLabel: "",
        happenedAt: new Date().toISOString().slice(0, 10),
      });

      void loadMoneyAccountOptions({
        accountRemoteId: preferredAccountRemoteId,
        allowAutoSelect: true,
      });
      void loadCategoryOptions({
        accountRemoteId: preferredAccountRemoteId,
        transactionType: type,
        allowAutoSelect: true,
      });
    },
    [
      accountOptions,
      activeAccountRemoteId,
      loadCategoryOptions,
      loadMoneyAccountOptions,
    ],
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
        categoryRemoteId: result.value.categoryRemoteId ?? "",
        categoryLabel:
          result.value.categoryNameSnapshot ??
          result.value.categoryLabel ??
          "",
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
      void loadCategoryOptions({
        accountRemoteId: result.value.accountRemoteId,
        transactionType: result.value.transactionType,
        preferredCategoryRemoteId: result.value.categoryRemoteId,
        preferredCategoryLabel:
          result.value.categoryNameSnapshot ??
          result.value.categoryLabel,
        allowAutoSelect: false,
      });
    },
    [getTransactionByIdUseCase, loadCategoryOptions, loadMoneyAccountOptions],
  );

  const close = useCallback(() => {
    moneyAccountLoadRequestIdRef.current += 1;
    categoryLoadRequestIdRef.current += 1;
    setMoneyAccountOptions([]);
    setCategoryOptions([]);
    setState(DEFAULT_EDITOR_STATE);
  }, []);

  const handleChangeType = useCallback((type: TransactionTypeValue) => {
    setState((currentState) => ({
      ...currentState,
      type,
      direction: deriveDirectionFromType(type, currentState.direction),
      categoryRemoteId: supportsCategorySelection(type)
        ? currentState.categoryRemoteId
        : "",
      categoryLabel: supportsCategorySelection(type)
        ? currentState.categoryLabel
        : "",
      fieldErrors: clearFieldError(currentState.fieldErrors, "categoryRemoteId"),
      errorMessage: null,
    }));

    void loadCategoryOptions({
      accountRemoteId: state.accountRemoteId,
      transactionType: type,
      preferredCategoryRemoteId: state.categoryRemoteId,
      preferredCategoryLabel: state.categoryLabel,
      allowAutoSelect: true,
    });
  }, [
    loadCategoryOptions,
    state.accountRemoteId,
    state.categoryLabel,
    state.categoryRemoteId,
  ]);

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
      fieldErrors: clearFieldError(currentState.fieldErrors, "title"),
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
        categoryRemoteId: "",
        categoryLabel: "",
        fieldErrors: {
          ...clearFieldError(currentState.fieldErrors, "accountRemoteId"),
          settlementMoneyAccountRemoteId: undefined,
          categoryRemoteId: undefined,
        },
        errorMessage: null,
      }));

      void loadMoneyAccountOptions({
        accountRemoteId,
        allowAutoSelect: true,
      });
      void loadCategoryOptions({
        accountRemoteId,
        transactionType: state.type,
        allowAutoSelect: true,
      });
    },
    [loadCategoryOptions, loadMoneyAccountOptions, state.type],
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

  const handleChangeCategoryRemoteId = useCallback((categoryRemoteId: string) => {
    setState((currentState) => ({
      ...currentState,
      categoryRemoteId,
      categoryLabel:
        categoryOptions.find((option) => option.remoteId === categoryRemoteId)?.label ??
        "",
      fieldErrors: clearFieldError(
        currentState.fieldErrors,
        "categoryRemoteId",
      ),
      errorMessage: null,
    }));
  }, [categoryOptions]);

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
    const selectedCategory = categoryOptions.find(
      (option) => option.remoteId === state.categoryRemoteId,
    );
    const parsedAmount = Number(state.amount.replace(/,/g, "").trim());
    const parsedDate = parseTransactionEditorDateInput(state.happenedAt);
    const requiresCategory = supportsCategorySelection(state.type);

    const nextFieldErrors = validateTransactionEditorState({
      mode: state.mode,
      title: state.title,
      accountRemoteId: state.accountRemoteId,
      settlementMoneyAccountRemoteId: state.settlementMoneyAccountRemoteId,
      categoryRemoteId: state.categoryRemoteId,
      selectedAccountExists: Boolean(selectedAccount),
      selectedMoneyAccountExists:
        state.settlementMoneyAccountRemoteId.trim().length === 0
          ? true
          : Boolean(selectedMoneyAccount),
      selectedCategoryExists:
        state.categoryRemoteId.trim().length === 0
          ? false
          : Boolean(selectedCategory),
      requiresCategory,
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

    const payload: SaveTransactionPayload = {
      remoteId: state.remoteId ?? createTransactionRemoteId(),
      ownerUserRemoteId,
      accountRemoteId: selectedAccount!.remoteId,
      accountDisplayNameSnapshot: selectedAccount!.label,
      transactionType: state.type,
      direction: state.direction,
      title: state.title.trim(),
      amount: parsedAmount,
      currencyCode: selectedAccount!.currencyCode,
      categoryRemoteId: selectedCategory?.remoteId ?? null,
      categoryNameSnapshot: selectedCategory?.label ?? null,
      categoryLabel: selectedCategory?.label ?? null,
      note: state.note.trim() || null,
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
    onSaved(
      state.mode === "create"
        ? "Transaction added."
        : "Transaction updated.",
    );
  }, [
    accountOptions,
    addTransactionUseCase,
    categoryOptions,
    close,
    moneyAccountOptions,
    onSaved,
    ownerUserRemoteId,
    state.accountRemoteId,
    state.amount,
    state.categoryRemoteId,
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
      categoryOptions,
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
      onChangeCategoryRemoteId: handleChangeCategoryRemoteId,
      onChangeNote: handleChangeNote,
      onChangeHappenedAt: handleChangeHappenedAt,
      submit,
    }),
    [
      accountOptions,
      availableDirections,
      availableTypes,
      categoryOptions,
      close,
      handleChangeAccountRemoteId,
      handleChangeAmount,
      handleChangeCategoryRemoteId,
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
