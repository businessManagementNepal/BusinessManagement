import { useCallback, useMemo, useState } from "react";
import { Account, AccountType } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import { GetLedgerEntryByRemoteIdUseCase } from "@/feature/ledger/useCase/getLedgerEntryByRemoteId.useCase";
import { UpdateLedgerEntryUseCase } from "@/feature/ledger/useCase/updateLedgerEntry.useCase";
import {
  LedgerBalanceDirection,
  LedgerBalanceDirectionValue,
  LedgerEntryType,
  LedgerEntryTypeValue,
  SaveLedgerEntryPayload,
} from "@/feature/ledger/types/ledger.entity.types";
import {
  LedgerAccountOptionState,
  LedgerDirectionOptionState,
  LedgerEditorFormState,
  LedgerEntryTypeOptionState,
} from "@/feature/ledger/types/ledger.state.types";
import { LedgerEditorViewModel } from "./ledgerEditor.viewModel";
import {
  getLedgerEntryTypeLabel,
  resolveDefaultDirectionForEntryType,
  shouldShowDirectionSelector,
} from "./ledger.shared";

const DEFAULT_LEDGER_STATE: LedgerEditorFormState = {
  visible: false,
  mode: "create",
  editingRemoteId: null,
  partyName: "",
  partyPhone: "",
  entryType: LedgerEntryType.Sale,
  balanceDirection: LedgerBalanceDirection.Receive,
  title: "",
  amount: "",
  note: "",
  happenedAt: new Date().toISOString().slice(0, 10),
  dueAt: "",
  settlementAccountRemoteId: "",
  isSaving: false,
  errorMessage: null,
};

const createLedgerRemoteId = (): string => {
  return `led-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const parseDateInput = (value: string): number | null => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return null;
  }

  const parsedDate = new Date(`${normalizedValue}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.getTime();
};

const formatDateInput = (timestamp: number | null): string => {
  if (timestamp === null) {
    return "";
  }

  return new Date(timestamp).toISOString().slice(0, 10);
};

type UseLedgerEditorViewModelParams = {
  ownerUserRemoteId: string;
  activeBusinessAccountRemoteId: string | null;
  accounts: readonly Account[];
  getLedgerEntryByRemoteIdUseCase: GetLedgerEntryByRemoteIdUseCase;
  addLedgerEntryUseCase: AddLedgerEntryUseCase;
  updateLedgerEntryUseCase: UpdateLedgerEntryUseCase;
  onSaved: () => void;
};

const entryTypeOptions: readonly LedgerEntryTypeOptionState[] = [
  { value: LedgerEntryType.Sale, label: "Sale" },
  { value: LedgerEntryType.Purchase, label: "Purchase" },
  { value: LedgerEntryType.Collection, label: "Collection" },
  { value: LedgerEntryType.PaymentOut, label: "Payment Out" },
  { value: LedgerEntryType.Refund, label: "Refund" },
  { value: LedgerEntryType.Advance, label: "Advance" },
  { value: LedgerEntryType.Adjustment, label: "Adjustment" },
] as const;

const directionOptions: readonly LedgerDirectionOptionState[] = [
  { value: LedgerBalanceDirection.Receive, label: "To Receive" },
  { value: LedgerBalanceDirection.Pay, label: "To Pay" },
] as const;

export const useLedgerEditorViewModel = ({
  ownerUserRemoteId,
  activeBusinessAccountRemoteId,
  accounts,
  getLedgerEntryByRemoteIdUseCase,
  addLedgerEntryUseCase,
  updateLedgerEntryUseCase,
  onSaved,
}: UseLedgerEditorViewModelParams): LedgerEditorViewModel => {
  const [state, setState] = useState<LedgerEditorFormState>(DEFAULT_LEDGER_STATE);

  const accountOptions = useMemo<readonly LedgerAccountOptionState[]>(() => {
    return accounts
      .filter((account) => account.accountType === AccountType.Business && account.isActive)
      .map((account) => ({
        remoteId: account.remoteId,
        label: account.displayName,
      }));
  }, [accounts]);

  const buildCreateState = useCallback(
    (
      entryType: LedgerEntryTypeValue,
      partyName = "",
      partyPhone = "",
    ): LedgerEditorFormState => {
      const settlementAccountRemoteId =
        activeBusinessAccountRemoteId ?? accountOptions[0]?.remoteId ?? "";

      const balanceDirection = resolveDefaultDirectionForEntryType(entryType);

      return {
        ...DEFAULT_LEDGER_STATE,
        visible: true,
        mode: "create",
        entryType,
        balanceDirection,
        title: getLedgerEntryTypeLabel(entryType),
        partyName,
        partyPhone,
        happenedAt: new Date().toISOString().slice(0, 10),
        settlementAccountRemoteId,
      };
    },
    [accountOptions, activeBusinessAccountRemoteId],
  );

  const openCreate = useCallback(
    (entryType: LedgerEntryTypeValue = LedgerEntryType.Sale) => {
      setState(buildCreateState(entryType));
    },
    [buildCreateState],
  );

  const openCreateForParty = useCallback(
    (
      partyName: string,
      partyPhone: string | null,
      entryType: LedgerEntryTypeValue,
    ) => {
      setState(buildCreateState(entryType, partyName, partyPhone ?? ""));
    },
    [buildCreateState],
  );

  const openEdit = useCallback(
    async (remoteId: string) => {
      const result = await getLedgerEntryByRemoteIdUseCase.execute(remoteId);

      if (!result.success) {
        setState((currentState) => ({
          ...currentState,
          visible: true,
          mode: "edit",
          editingRemoteId: remoteId,
          errorMessage: result.error.message,
        }));
        return;
      }

      setState({
        visible: true,
        mode: "edit",
        editingRemoteId: result.value.remoteId,
        partyName: result.value.partyName,
        partyPhone: result.value.partyPhone ?? "",
        entryType: result.value.entryType,
        balanceDirection: result.value.balanceDirection,
        title: result.value.title,
        amount: String(result.value.amount),
        note: result.value.note ?? "",
        happenedAt: formatDateInput(result.value.happenedAt),
        dueAt: formatDateInput(result.value.dueAt),
        settlementAccountRemoteId: result.value.settlementAccountRemoteId ?? "",
        isSaving: false,
        errorMessage: null,
      });
    },
    [getLedgerEntryByRemoteIdUseCase],
  );

  const close = useCallback(() => {
    setState(DEFAULT_LEDGER_STATE);
  }, []);

  const handleChangeEntryType = useCallback((entryType: LedgerEntryTypeValue) => {
    setState((currentState) => ({
      ...currentState,
      entryType,
      balanceDirection: shouldShowDirectionSelector(entryType)
        ? currentState.balanceDirection
        : resolveDefaultDirectionForEntryType(entryType),
      title:
        currentState.title.trim().length === 0 ||
        currentState.title === getLedgerEntryTypeLabel(currentState.entryType)
          ? getLedgerEntryTypeLabel(entryType)
          : currentState.title,
      errorMessage: null,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const normalizedPartyName = state.partyName.trim();
    const normalizedPartyPhone = state.partyPhone.trim();
    const normalizedTitle = state.title.trim();
    const amount = Number(state.amount);
    const happenedAt = parseDateInput(state.happenedAt);
    const dueAt = parseDateInput(state.dueAt);
    const normalizedSettlementAccountRemoteId =
      state.settlementAccountRemoteId.trim() || null;

    if (!normalizedPartyName) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Party name is required.",
      }));
      return;
    }

    if (!normalizedTitle) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Entry title is required.",
      }));
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Amount must be greater than zero.",
      }));
      return;
    }

    if (happenedAt === null) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Enter a valid date in YYYY-MM-DD format.",
      }));
      return;
    }

    if (state.dueAt.trim().length > 0 && dueAt === null) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Enter a valid due date in YYYY-MM-DD format.",
      }));
      return;
    }

    const businessAccountRemoteId =
      activeBusinessAccountRemoteId ?? normalizedSettlementAccountRemoteId ?? "";

    if (!businessAccountRemoteId) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Business account context is required.",
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      isSaving: true,
      errorMessage: null,
    }));

    const selectedAccount = accountOptions.find(
      (account) => account.remoteId === normalizedSettlementAccountRemoteId,
    );

    const payload: SaveLedgerEntryPayload = {
      remoteId: state.mode === "create" ? createLedgerRemoteId() : state.editingRemoteId ?? "",
      businessAccountRemoteId,
      ownerUserRemoteId,
      partyName: normalizedPartyName,
      partyPhone: normalizedPartyPhone || null,
      entryType: state.entryType,
      balanceDirection: shouldShowDirectionSelector(state.entryType)
        ? state.balanceDirection
        : resolveDefaultDirectionForEntryType(state.entryType),
      title: normalizedTitle,
      amount,
      currencyCode: "NPR",
      note: state.note.trim() || null,
      happenedAt,
      dueAt: state.dueAt.trim().length === 0 ? null : dueAt,
      settlementAccountRemoteId: normalizedSettlementAccountRemoteId,
      settlementAccountDisplayNameSnapshot: selectedAccount?.label ?? null,
    };

    const result =
      state.mode === "create"
        ? await addLedgerEntryUseCase.execute(payload)
        : await updateLedgerEntryUseCase.execute(payload);

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
    activeBusinessAccountRemoteId,
    addLedgerEntryUseCase,
    close,
    onSaved,
    ownerUserRemoteId,
    state.amount,
    state.balanceDirection,
    state.dueAt,
    state.editingRemoteId,
    state.entryType,
    state.happenedAt,
    state.mode,
    state.partyName,
    state.partyPhone,
    state.settlementAccountRemoteId,
    state.note,
    state.title,
    updateLedgerEntryUseCase,
  ]);

  return useMemo(
    () => ({
      state,
      accountOptions,
      availableEntryTypes: entryTypeOptions,
      availableDirections: directionOptions,
      openCreate,
      openCreateForParty,
      openEdit,
      close,
      onChangeEntryType: handleChangeEntryType,
      onChangeBalanceDirection: (balanceDirection: LedgerBalanceDirectionValue) =>
        setState((currentState) => ({
          ...currentState,
          balanceDirection,
          errorMessage: null,
        })),
      onChangePartyName: (partyName: string) =>
        setState((currentState) => ({
          ...currentState,
          partyName,
          errorMessage: null,
        })),
      onChangePartyPhone: (partyPhone: string) =>
        setState((currentState) => ({
          ...currentState,
          partyPhone,
          errorMessage: null,
        })),
      onChangeTitle: (title: string) =>
        setState((currentState) => ({
          ...currentState,
          title,
          errorMessage: null,
        })),
      onChangeAmount: (amount: string) =>
        setState((currentState) => ({
          ...currentState,
          amount,
          errorMessage: null,
        })),
      onChangeNote: (note: string) =>
        setState((currentState) => ({
          ...currentState,
          note,
          errorMessage: null,
        })),
      onChangeHappenedAt: (happenedAt: string) =>
        setState((currentState) => ({
          ...currentState,
          happenedAt,
          errorMessage: null,
        })),
      onChangeDueAt: (dueAt: string) =>
        setState((currentState) => ({
          ...currentState,
          dueAt,
          errorMessage: null,
        })),
      onChangeSettlementAccountRemoteId: (settlementAccountRemoteId: string) =>
        setState((currentState) => ({
          ...currentState,
          settlementAccountRemoteId,
          errorMessage: null,
        })),
      submit: handleSubmit,
    }),
    [
      accountOptions,
      close,
      handleChangeEntryType,
      handleSubmit,
      openCreate,
      openCreateForParty,
      openEdit,
      state,
    ],
  );
};
