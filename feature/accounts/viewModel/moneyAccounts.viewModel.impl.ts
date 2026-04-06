import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MoneyAccount,
  MoneyAccountType,
} from "@/feature/accounts/types/moneyAccount.types";
import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import { SaveMoneyAccountUseCase } from "@/feature/accounts/useCase/saveMoneyAccount.useCase";
import { ArchiveMoneyAccountUseCase } from "@/feature/accounts/useCase/archiveMoneyAccount.useCase";
import {
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
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  canManage: boolean;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  saveMoneyAccountUseCase: SaveMoneyAccountUseCase;
  archiveMoneyAccountUseCase: ArchiveMoneyAccountUseCase;
};

export const useMoneyAccountsViewModel = ({
  activeUserRemoteId,
  scopeAccountRemoteId,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  canManage,
  getMoneyAccountsUseCase,
  saveMoneyAccountUseCase,
  archiveMoneyAccountUseCase,
}: UseMoneyAccountsViewModelParams): MoneyAccountsViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<MoneyAccount[]>([]);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<MoneyAccountFormState>(EMPTY_FORM);
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
      setErrorMessage(null);
      setForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
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

    const parsedBalance = parseBalance(form.balance);

    if (parsedBalance === null) {
      setErrorMessage("Balance is required.");
      return;
    }

    const isFirstScopeAccount = accounts.length === 0;
    const existingRecord = accounts.find(
      (account) => account.remoteId === form.remoteId,
    );

    const result = await saveMoneyAccountUseCase.execute({
      remoteId: form.remoteId ?? Crypto.randomUUID(),
      ownerUserRemoteId: activeUserRemoteId,
      scopeAccountRemoteId,
      name: form.name,
      type: form.type,
      currentBalance: parsedBalance,
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
    loadMoneyAccounts,
    saveMoneyAccountUseCase,
    scopeAccountRemoteId,
    currencyCode,
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
      canDeleteCurrent,
      isDeleteModalVisible: Boolean(pendingDeleteRemoteId),
      pendingDeleteAccountName,
      deleteErrorMessage,
      isDeleting,
      onRefresh: loadMoneyAccounts,
      onOpenCreate,
      onOpenEdit,
      onCloseEditor,
      onFormChange,
      onSubmit,
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
      activeAccountCountryCode,
      isDeleting,
      pendingDeleteAccountName,
      pendingDeleteRemoteId,
      isEditorVisible,
      isLoading,
      loadMoneyAccounts,
      onCloseDeleteModal,
      onCloseEditor,
      onConfirmDelete,
      onFormChange,
      onOpenCreate,
      onOpenEdit,
      onRequestDeleteCurrent,
      onSubmit,
      totalBalance,
    ],
  );
};
