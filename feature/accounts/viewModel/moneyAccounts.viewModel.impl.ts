import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MoneyAccount,
  MoneyAccountType,
} from "@/feature/accounts/types/moneyAccount.types";
import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import { SaveMoneyAccountUseCase } from "@/feature/accounts/useCase/saveMoneyAccount.useCase";
import { ArchiveMoneyAccountUseCase } from "@/feature/accounts/useCase/archiveMoneyAccount.useCase";
import { AdjustMoneyAccountBalanceUseCase } from "@/feature/accounts/useCase/adjustMoneyAccountBalance.useCase";
import {
  MoneyAccountAdjustmentFormState,
  MoneyAccountFormState,
  MoneyAccountsViewModel,
} from "./moneyAccounts.viewModel";
import {
  formatCurrencyAmount,
  resolveCurrencyCode,
} from "@/shared/utils/currency/accountCurrency";

const EMPTY_FORM: MoneyAccountFormState = {
  remoteId: null,
  name: "",
  type: MoneyAccountType.Cash,
  balance: "0",
  description: "",
};

const EMPTY_ADJUSTMENT_FORM: MoneyAccountAdjustmentFormState = {
  moneyAccountRemoteId: null,
  accountName: "",
  currentBalanceLabel: "",
  targetBalance: "",
  reason: "",
  errorMessage: null,
  isSaving: false,
};

const mapMoneyAccountToForm = (
  moneyAccount: MoneyAccount,
): MoneyAccountFormState => ({
  remoteId: moneyAccount.remoteId,
  name: moneyAccount.name,
  type: moneyAccount.type,
  balance: String(moneyAccount.currentBalance),
  description: moneyAccount.description ?? "",
});

const parseBalance = (value: string): number | null => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const sortAccounts = (accounts: readonly MoneyAccount[]): MoneyAccount[] => {
  return [...accounts].sort((leftAccount, rightAccount) => {
    if (leftAccount.isPrimary && !rightAccount.isPrimary) {
      return -1;
    }

    if (!leftAccount.isPrimary && rightAccount.isPrimary) {
      return 1;
    }

    return rightAccount.updatedAt - leftAccount.updatedAt;
  });
};

type UseMoneyAccountsViewModelParams = {
  activeUserRemoteId: string | null;
  scopeAccountRemoteId: string | null;
  scopeAccountDisplayName: string;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  canManage: boolean;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  saveMoneyAccountUseCase: SaveMoneyAccountUseCase;
  archiveMoneyAccountUseCase: ArchiveMoneyAccountUseCase;
  adjustMoneyAccountBalanceUseCase: AdjustMoneyAccountBalanceUseCase;
  onOpenAccountHistory: (
    moneyAccountRemoteId: string,
    moneyAccountName: string,
  ) => void;
};

export const useMoneyAccountsViewModel = ({
  activeUserRemoteId,
  scopeAccountRemoteId,
  scopeAccountDisplayName,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  canManage,
  getMoneyAccountsUseCase,
  saveMoneyAccountUseCase,
  archiveMoneyAccountUseCase,
  adjustMoneyAccountBalanceUseCase,
  onOpenAccountHistory,
}: UseMoneyAccountsViewModelParams): MoneyAccountsViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<MoneyAccount[]>([]);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<MoneyAccountFormState>(EMPTY_FORM);
  const [adjustmentForm, setAdjustmentForm] =
    useState<MoneyAccountAdjustmentFormState>(EMPTY_ADJUSTMENT_FORM);
  const [isAdjustmentModalVisible, setIsAdjustmentModalVisible] = useState(false);
  const [pendingDeleteRemoteId, setPendingDeleteRemoteId] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMoneyAccounts = useCallback(async () => {
    if (!scopeAccountRemoteId) {
      setAccounts([]);
      setErrorMessage("An active account context is required to manage accounts.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const result = await getMoneyAccountsUseCase.execute(scopeAccountRemoteId);

    if (!result.success) {
      setAccounts([]);
      setErrorMessage(result.error.message);
      setIsLoading(false);
      return;
    }

    setAccounts(sortAccounts(result.value));
    setErrorMessage(null);
    setIsLoading(false);
  }, [getMoneyAccountsUseCase, scopeAccountRemoteId]);

  useEffect(() => {
    void loadMoneyAccounts();
  }, [loadMoneyAccounts]);

  const onOpenCreate = useCallback(() => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage money accounts.");
      return;
    }

    setEditorMode("create");
    setForm(EMPTY_FORM);
    setErrorMessage(null);
    setDeleteErrorMessage(null);
    setIsEditorVisible(true);
  }, [canManage]);

  const onOpenEdit = useCallback((account: MoneyAccount) => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage money accounts.");
      return;
    }

    setEditorMode("edit");
    setForm(mapMoneyAccountToForm(account));
    setErrorMessage(null);
    setDeleteErrorMessage(null);
    setIsEditorVisible(true);
  }, [canManage]);

  const onCloseEditor = useCallback(() => {
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
    setErrorMessage(null);
    setDeleteErrorMessage(null);
  }, []);

  const onFormChange = useCallback(
    (field: keyof MoneyAccountFormState, value: string) => {
      if (field === "balance" && editorMode === "edit") {
        return;
      }

      setErrorMessage(null);
      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [editorMode],
  );

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => sum + account.currentBalance, 0);
  }, [accounts]);

  const currencyCode = useMemo(
    () =>
      resolveCurrencyCode({
        currencyCode: activeAccountCurrencyCode,
        countryCode: activeAccountCountryCode,
      }),
    [activeAccountCountryCode, activeAccountCurrencyCode],
  );

  const onSubmit = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage money accounts.");
      return;
    }

    if (!activeUserRemoteId) {
      setErrorMessage("An active user session is required to save accounts.");
      return;
    }

    if (!scopeAccountRemoteId) {
      setErrorMessage("An active account context is required to save accounts.");
      return;
    }

    const remoteIdForSave = form.remoteId ?? Crypto.randomUUID();

    if (editorMode === "create" && form.remoteId !== remoteIdForSave) {
      setForm((current) => ({
        ...current,
        remoteId: remoteIdForSave,
      }));
    }

    const isFirstScopeAccount = accounts.length === 0;
    const existingRecord = accounts.find(
      (account) => account.remoteId === form.remoteId,
    );
    const parsedOpeningBalance = parseBalance(form.balance);
    const balanceForSave =
      editorMode === "edit" && existingRecord
        ? existingRecord.currentBalance
        : parsedOpeningBalance;

    if (balanceForSave === null) {
      setErrorMessage("Opening balance is required.");
      return;
    }

    const result = await saveMoneyAccountUseCase.execute({
      remoteId: remoteIdForSave,
      ownerUserRemoteId: activeUserRemoteId,
      scopeAccountRemoteId,
      scopeAccountDisplayNameSnapshot: scopeAccountDisplayName,
      name: form.name,
      type: form.type,
      currentBalance: balanceForSave,
      description: form.description || null,
      currencyCode,
      isPrimary: existingRecord?.isPrimary ?? isFirstScopeAccount,
      isActive: true,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    setAccounts((currentAccounts) =>
      sortAccounts(
        (() => {
          const existingIndex = currentAccounts.findIndex(
            (account) => account.remoteId === result.value.remoteId,
          );
          if (existingIndex === -1) {
            return [result.value, ...currentAccounts];
          }
          return currentAccounts.map((account, index) =>
            index === existingIndex ? result.value : account,
          );
        })(),
      ),
    );
    setErrorMessage(null);
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
    void loadMoneyAccounts();
  }, [
    accounts,
    activeUserRemoteId,
    canManage,
    form,
    editorMode,
    scopeAccountDisplayName,
    loadMoneyAccounts,
    saveMoneyAccountUseCase,
    scopeAccountRemoteId,
    currencyCode,
  ]);

  const onOpenHistoryForCurrent = useCallback(() => {
    if (editorMode !== "edit" || !form.remoteId) {
      return;
    }

    const targetAccount = accounts.find((account) => account.remoteId === form.remoteId);
    if (!targetAccount) {
      setErrorMessage("Money account not found.");
      return;
    }

    onOpenAccountHistory(targetAccount.remoteId, targetAccount.name);
  }, [accounts, editorMode, form.remoteId, onOpenAccountHistory]);

  const onOpenAdjustmentForCurrent = useCallback(() => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage money accounts.");
      return;
    }

    if (editorMode !== "edit" || !form.remoteId) {
      return;
    }

    const targetAccount = accounts.find((account) => account.remoteId === form.remoteId);
    if (!targetAccount) {
      setErrorMessage("Money account not found.");
      return;
    }

    setAdjustmentForm({
      moneyAccountRemoteId: targetAccount.remoteId,
      accountName: targetAccount.name,
      currentBalanceLabel: formatCurrencyAmount({
        amount: targetAccount.currentBalance,
        currencyCode,
        countryCode: activeAccountCountryCode,
      }),
      targetBalance: String(targetAccount.currentBalance),
      reason: "",
      errorMessage: null,
      isSaving: false,
    });
    setIsEditorVisible(false);
    setIsAdjustmentModalVisible(true);
  }, [
    accounts,
    activeAccountCountryCode,
    canManage,
    currencyCode,
    editorMode,
    form.remoteId,
  ]);

  const onCloseAdjustment = useCallback(() => {
    if (adjustmentForm.isSaving) {
      return;
    }

    setIsAdjustmentModalVisible(false);
    setAdjustmentForm(EMPTY_ADJUSTMENT_FORM);
  }, [adjustmentForm.isSaving]);

  const onAdjustmentFormChange = useCallback(
    (
      field: keyof Pick<
        MoneyAccountAdjustmentFormState,
        "targetBalance" | "reason"
      >,
      value: string,
    ) => {
      setAdjustmentForm((current) => ({
        ...current,
        [field]: value,
        errorMessage: null,
      }));
    },
    [],
  );

  const onSubmitAdjustment = useCallback(async () => {
    if (!canManage) {
      setAdjustmentForm((current) => ({
        ...current,
        errorMessage: "You do not have permission to manage money accounts.",
      }));
      return;
    }

    if (!activeUserRemoteId || !scopeAccountRemoteId) {
      setAdjustmentForm((current) => ({
        ...current,
        errorMessage: "An active account context is required.",
      }));
      return;
    }

    if (!scopeAccountDisplayName.trim()) {
      setAdjustmentForm((current) => ({
        ...current,
        errorMessage: "Account label is required.",
      }));
      return;
    }

    if (!adjustmentForm.moneyAccountRemoteId) {
      setAdjustmentForm((current) => ({
        ...current,
        errorMessage: "Money account is required.",
      }));
      return;
    }

    const parsedTargetBalance = parseBalance(adjustmentForm.targetBalance);
    if (parsedTargetBalance === null) {
      setAdjustmentForm((current) => ({
        ...current,
        errorMessage: "Correct balance is required.",
      }));
      return;
    }

    if (!adjustmentForm.reason.trim()) {
      setAdjustmentForm((current) => ({
        ...current,
        errorMessage: "Reason is required.",
      }));
      return;
    }

    setAdjustmentForm((current) => ({
      ...current,
      errorMessage: null,
      isSaving: true,
    }));

    const result = await adjustMoneyAccountBalanceUseCase.execute({
      ownerUserRemoteId: activeUserRemoteId,
      scopeAccountRemoteId,
      scopeAccountDisplayNameSnapshot: scopeAccountDisplayName,
      moneyAccountRemoteId: adjustmentForm.moneyAccountRemoteId,
      targetBalance: parsedTargetBalance,
      reason: adjustmentForm.reason,
      adjustedAt: Date.now(),
    });

    if (!result.success) {
      setAdjustmentForm((current) => ({
        ...current,
        errorMessage: result.error.message,
        isSaving: false,
      }));
      return;
    }

    setAccounts((currentAccounts) =>
      sortAccounts(
        currentAccounts.map((account) =>
          account.remoteId === result.value.remoteId ? result.value : account,
        ),
      ),
    );
    setIsAdjustmentModalVisible(false);
    setAdjustmentForm(EMPTY_ADJUSTMENT_FORM);
    setErrorMessage(null);
    void loadMoneyAccounts();
  }, [
    activeUserRemoteId,
    adjustMoneyAccountBalanceUseCase,
    adjustmentForm.moneyAccountRemoteId,
    adjustmentForm.reason,
    adjustmentForm.targetBalance,
    canManage,
    loadMoneyAccounts,
    scopeAccountDisplayName,
    scopeAccountRemoteId,
  ]);

  const canDeleteCurrent = useMemo(() => {
    if (editorMode !== "edit" || !form.remoteId) {
      return false;
    }

    const targetAccount = accounts.find((account) => account.remoteId === form.remoteId);
    if (!targetAccount) {
      return false;
    }

    if (targetAccount.isPrimary) {
      return false;
    }

    return accounts.length > 1;
  }, [accounts, editorMode, form.remoteId]);

  const onRequestDeleteCurrent = useCallback((): void => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage money accounts.");
      return;
    }

    if (editorMode !== "edit" || !form.remoteId) {
      return;
    }

    const targetAccount = accounts.find((account) => account.remoteId === form.remoteId);
    if (!targetAccount) {
      setErrorMessage("Money account not found.");
      return;
    }
    if (targetAccount.isPrimary) {
      setErrorMessage("Primary account cannot be deleted.");
      return;
    }
    if (accounts.length <= 1) {
      setErrorMessage("At least one active account is required.");
      return;
    }

    setPendingDeleteRemoteId(targetAccount.remoteId);
    setDeleteErrorMessage(null);
  }, [accounts, canManage, editorMode, form.remoteId]);

  const onCloseDeleteModal = useCallback((): void => {
    if (isDeleting) {
      return;
    }
    setPendingDeleteRemoteId(null);
    setDeleteErrorMessage(null);
  }, [isDeleting]);

  const onConfirmDelete = useCallback(async (): Promise<void> => {
    if (!canManage) {
      setDeleteErrorMessage("You do not have permission to manage money accounts.");
      return;
    }
    if (!pendingDeleteRemoteId) {
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMessage(null);

    const archiveMoneyAccountResult = await archiveMoneyAccountUseCase.execute(
      pendingDeleteRemoteId,
    );
    setIsDeleting(false);

    if (!archiveMoneyAccountResult.success) {
      setDeleteErrorMessage(archiveMoneyAccountResult.error.message);
      return;
    }

    setAccounts((currentAccounts) =>
      sortAccounts(
        currentAccounts.filter((account) => account.remoteId !== pendingDeleteRemoteId),
      ),
    );
    setPendingDeleteRemoteId(null);
    setDeleteErrorMessage(null);
    setErrorMessage(null);
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
    void loadMoneyAccounts();
  }, [
    archiveMoneyAccountUseCase,
    canManage,
    loadMoneyAccounts,
    pendingDeleteRemoteId,
  ]);

  const pendingDeleteAccountName = useMemo(() => {
    if (!pendingDeleteRemoteId) {
      return null;
    }
    const account = accounts.find((item) => item.remoteId === pendingDeleteRemoteId);
    return account?.name ?? null;
  }, [accounts, pendingDeleteRemoteId]);

  return useMemo(
    () => ({
      isLoading,
      errorMessage,
      canManage,
      currencyCode,
      countryCode: activeAccountCountryCode,
      currencyLabel: currencyCode,
      totalBalanceLabel: formatCurrencyAmount({
        amount: totalBalance,
        currencyCode,
        countryCode: activeAccountCountryCode,
      }),
      accounts,
      isEditorVisible,
      editorMode,
      form,
      adjustmentForm,
      canDeleteCurrent,
      isDeleteModalVisible: Boolean(pendingDeleteRemoteId),
      isAdjustmentModalVisible,
      pendingDeleteAccountName,
      deleteErrorMessage,
      isDeleting,
      onRefresh: loadMoneyAccounts,
      onOpenCreate,
      onOpenEdit,
      onCloseEditor,
      onFormChange,
      onSubmit,
      onOpenHistoryForCurrent,
      onOpenAdjustmentForCurrent,
      onCloseAdjustment,
      onAdjustmentFormChange,
      onSubmitAdjustment,
      onRequestDeleteCurrent,
      onCloseDeleteModal,
      onConfirmDelete,
    }),
    [
      accounts,
      canDeleteCurrent,
      canManage,
      currencyCode,
      deleteErrorMessage,
      editorMode,
      errorMessage,
      form,
      adjustmentForm,
      activeAccountCountryCode,
      isAdjustmentModalVisible,
      isDeleting,
      pendingDeleteAccountName,
      pendingDeleteRemoteId,
      isEditorVisible,
      isLoading,
      loadMoneyAccounts,
      onCloseDeleteModal,
      onCloseEditor,
      onCloseAdjustment,
      onConfirmDelete,
      onAdjustmentFormChange,
      onFormChange,
      onOpenHistoryForCurrent,
      onOpenCreate,
      onOpenEdit,
      onOpenAdjustmentForCurrent,
      onRequestDeleteCurrent,
      onSubmitAdjustment,
      onSubmit,
      totalBalance,
    ],
  );
};
