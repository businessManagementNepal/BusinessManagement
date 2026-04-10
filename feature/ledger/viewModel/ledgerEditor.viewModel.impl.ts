import {
  LedgerEntry,
  LedgerEntryType,
  LedgerEntryTypeValue,
  LedgerPaymentMode,
  SaveLedgerEntryPayload,
} from "@/feature/ledger/types/ledger.entity.types";
import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { GetMoneyAccountsUseCase } from "@/feature/accounts/useCase/getMoneyAccounts.useCase";
import {
  MoneyAccount,
  MoneyAccountType,
} from "@/feature/accounts/types/moneyAccount.types";
import { ContactType } from "@/feature/contacts/types/contact.types";
import { GetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase";
import { SaveContactUseCase } from "@/feature/contacts/useCase/saveContact.useCase";
import {
  LedgerAccountOptionState,
  LedgerEditorFieldErrors,
  LedgerEditorFormState,
  LedgerEntryTypeOptionState,
  LedgerSettlementLinkOptionState,
} from "@/feature/ledger/types/ledger.state.types";
import { AddLedgerEntryUseCase } from "@/feature/ledger/useCase/addLedgerEntry.useCase";
import { GetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase";
import { GetLedgerEntryByRemoteIdUseCase } from "@/feature/ledger/useCase/getLedgerEntryByRemoteId.useCase";
import { UpdateLedgerEntryUseCase } from "@/feature/ledger/useCase/updateLedgerEntry.useCase";
import { useCallback, useMemo, useState } from "react";
import {
  buildSettlementLinkCandidates,
  formatDateInput,
  getLedgerEntryTypeLabel,
  parseDateInput,
  requiresDueDate,
  requiresPaymentMode,
  resolveDefaultDirectionForEntryType,
} from "./ledger.shared";
import { LedgerEditorViewModel } from "./ledgerEditor.viewModel";
import { resolveCurrencyCode } from "@/shared/utils/currency/accountCurrency";
import { pickImageFromLibrary } from "@/shared/utils/media/pickImage";
import { DeleteBusinessTransactionUseCase } from "@/feature/transactions/useCase/deleteBusinessTransaction.useCase";
import { PostBusinessTransactionUseCase } from "@/feature/transactions/useCase/postBusinessTransaction.useCase";
import {
  SaveTransactionPayload,
  TransactionDirection,
  TransactionType,
  TransactionSourceModule,
} from "@/feature/transactions/types/transaction.entity.types";
import {
  BillingDocumentStatus,
  BillingDocumentType,
  BillingTemplateType,
} from "@/feature/billing/types/billing.types";
import { SaveBillingDocumentUseCase } from "@/feature/billing/useCase/saveBillingDocument.useCase";
import { ReplaceBillingDocumentAllocationsForSettlementEntryUseCase } from "@/feature/billing/useCase/replaceBillingDocumentAllocationsForSettlementEntry.useCase";
import { DeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase } from "@/feature/billing/useCase/deleteBillingDocumentAllocationsBySettlementEntryRemoteId.useCase";

const DEFAULT_LEDGER_STATE: LedgerEditorFormState = {
  visible: false,
  mode: "create",
  editingRemoteId: null,
  entryType: LedgerEntryType.Sale,
  partyName: "",
  amount: "",
  happenedAt: formatDateInput(Date.now()),
  dueAt: "",
  settlementAccountRemoteId: "",
  referenceNumber: "",
  note: "",
  reminderAt: "",
  attachmentUri: "",
  settledAgainstEntryRemoteId: "",
  linkedDocumentRemoteId: null,
  linkedTransactionRemoteId: null,
  showMoreDetails: false,
  fieldErrors: {},
  isSaving: false,
  errorMessage: null,
};

const createLedgerRemoteId = (): string => {
  return `led-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createTransactionRemoteId = (): string => {
  return `txn-ledger-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createContactRemoteId = (): string => {
  return `con-ledger-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createBillingDocumentRemoteId = (): string => {
  return `bill-ledger-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const buildLedgerDocumentNumber = ({
  entryType,
  remoteId,
  happenedAt,
}: {
  entryType: LedgerEntryTypeValue;
  remoteId: string;
  happenedAt: number;
}): string => {
  const year = new Date(happenedAt).getUTCFullYear();
  const token = remoteId.replace(/-/g, "").slice(-8).toUpperCase();
  const prefix = entryType === LedgerEntryType.Sale ? "INV" : "BILL";
  return `${prefix}-${year}-${token}`;
};

const resolveBillingDocumentTypeForEntryType = (
  entryType: LedgerEntryTypeValue,
): (typeof BillingDocumentType)[keyof typeof BillingDocumentType] => {
  if (entryType === LedgerEntryType.Sale) {
    return BillingDocumentType.Invoice;
  }

  return BillingDocumentType.Receipt;
};

const resolveBillingTemplateTypeForEntryType = (
  entryType: LedgerEntryTypeValue,
): (typeof BillingTemplateType)[keyof typeof BillingTemplateType] => {
  if (entryType === LedgerEntryType.Sale) {
    return BillingTemplateType.StandardInvoice;
  }

  return BillingTemplateType.DetailedInvoice;
};

const buildLedgerDocumentItemName = (entryType: LedgerEntryTypeValue): string => {
  if (entryType === LedgerEntryType.Sale) {
    return "Sale Due";
  }

  if (entryType === LedgerEntryType.Purchase) {
    return "Purchase Due";
  }

  return "Ledger Due";
};

type UseLedgerEditorViewModelParams = {
  ownerUserRemoteId: string;
  activeBusinessAccountRemoteId: string | null;
  activeBusinessAccountDisplayName: string;
  activeBusinessCurrencyCode: string | null;
  getLedgerEntriesUseCase: GetLedgerEntriesUseCase;
  getLedgerEntryByRemoteIdUseCase: GetLedgerEntryByRemoteIdUseCase;
  addLedgerEntryUseCase: AddLedgerEntryUseCase;
  updateLedgerEntryUseCase: UpdateLedgerEntryUseCase;
  getContactsUseCase: GetContactsUseCase;
  saveContactUseCase: SaveContactUseCase;
  getMoneyAccountsUseCase: GetMoneyAccountsUseCase;
  postBusinessTransactionUseCase: PostBusinessTransactionUseCase;
  deleteBusinessTransactionUseCase: DeleteBusinessTransactionUseCase;
  saveBillingDocumentUseCase: SaveBillingDocumentUseCase;
  replaceBillingDocumentAllocationsForSettlementEntryUseCase: ReplaceBillingDocumentAllocationsForSettlementEntryUseCase;
  deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase: DeleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase;
  onSaved: () => void;
};

const entryTypeOptions: readonly LedgerEntryTypeOptionState[] = [
  { value: LedgerEntryType.Sale, label: "Sale Due" },
  { value: LedgerEntryType.Purchase, label: "Purchase Due" },
  { value: LedgerEntryType.Collection, label: "Receive Money" },
  { value: LedgerEntryType.PaymentOut, label: "Pay Money" },
] as const;

const normalizePartyName = (value: string): string => value.trim().toLowerCase();

const resolveContactTypeForEntryType = (
  entryType: LedgerEntryTypeValue,
): (typeof ContactType)[keyof typeof ContactType] => {
  if (entryType === LedgerEntryType.Sale || entryType === LedgerEntryType.Collection) {
    return ContactType.Customer;
  }

  if (
    entryType === LedgerEntryType.Purchase ||
    entryType === LedgerEntryType.PaymentOut
  ) {
    return ContactType.Supplier;
  }

  return ContactType.Other;
};

const mapMoneyAccountToSettlementOption = (
  moneyAccount: MoneyAccount,
): LedgerAccountOptionState => {
  const accountTypeLabel =
    moneyAccount.type === MoneyAccountType.Cash
      ? "Cash"
      : moneyAccount.type === MoneyAccountType.Bank
        ? "Bank"
        : "Wallet";
  const primaryTag = moneyAccount.isPrimary ? " (Primary)" : "";

  return {
    remoteId: moneyAccount.remoteId,
    label: `${moneyAccount.name} | ${accountTypeLabel}${primaryTag}`, 
    currencyCode: moneyAccount.currencyCode,
  };
};

const derivePaymentModeFromMoneyAccount = (
  moneyAccount: MoneyAccount,
): (typeof LedgerPaymentMode)[keyof typeof LedgerPaymentMode] => {
  if (moneyAccount.type === MoneyAccountType.Cash) {
    return LedgerPaymentMode.Cash;
  }

  if (moneyAccount.type === MoneyAccountType.Wallet) {
    return LedgerPaymentMode.MobileWallet;
  }

  return LedgerPaymentMode.BankTransfer;
};

const buildAutoTitle = (entryType: LedgerEntryTypeValue, partyName: string): string => {
  const actionLabel = getLedgerEntryTypeLabel(entryType);
  if (!partyName.trim()) {
    return actionLabel;
  }

  return `${actionLabel} - ${partyName.trim()}`;
};

const clearFieldError = (
  fieldErrors: LedgerEditorFieldErrors,
  field: keyof LedgerEditorFieldErrors,
): LedgerEditorFieldErrors => {
  if (!fieldErrors[field]) {
    return fieldErrors;
  }

  return {
    ...fieldErrors,
    [field]: undefined,
  };
};

const buildSettlementTransactionPayload = ({
  remoteId,
  ownerUserRemoteId,
  businessAccountRemoteId,
  businessAccountDisplayName,
  entryType,
  partyName,
  amount,
  currencyCode,
  note,
  happenedAt,
  sourceRemoteId,
  settlementMoneyAccountRemoteId,
  settlementMoneyAccountDisplayNameSnapshot,
}: {
  remoteId: string;
  ownerUserRemoteId: string;
  businessAccountRemoteId: string;
  businessAccountDisplayName: string;
  entryType: LedgerEntryTypeValue;
  partyName: string;
  amount: number;
  currencyCode: string | null;
  note: string | null;
  happenedAt: number;
  sourceRemoteId: string;
  settlementMoneyAccountRemoteId: string | null;
  settlementMoneyAccountDisplayNameSnapshot: string | null;
}): SaveTransactionPayload => {
  const isReceive = entryType === LedgerEntryType.Collection;

  return {
    remoteId,
    ownerUserRemoteId,
    accountRemoteId: businessAccountRemoteId,
    accountDisplayNameSnapshot: businessAccountDisplayName,
    transactionType: isReceive ? TransactionType.Income : TransactionType.Expense,
    direction: isReceive ? TransactionDirection.In : TransactionDirection.Out,
    title: `${isReceive ? "Received from" : "Paid to"} ${partyName}`,
    amount,
    currencyCode,
    categoryLabel: "Ledger",
    note,
    happenedAt,
    settlementMoneyAccountRemoteId,
    settlementMoneyAccountDisplayNameSnapshot,
    sourceModule: TransactionSourceModule.Ledger,
    sourceRemoteId,
    sourceAction: "settlement",
    idempotencyKey: `ledger:${sourceRemoteId}:settlement`,
  };
};

const isLikelyDuplicate = ({
  entries,
  editingRemoteId,
  entryType,
  partyName,
  amount,
  happenedAtInput,
}: {
  entries: readonly LedgerEntry[];
  editingRemoteId: string | null;
  entryType: LedgerEntryTypeValue;
  partyName: string;
  amount: number;
  happenedAtInput: string;
}): boolean => {
  const normalizedPartyName = normalizePartyName(partyName);
  const normalizedDate = happenedAtInput.trim();

  return entries.some((entry) => {
    if (editingRemoteId && entry.remoteId === editingRemoteId) {
      return false;
    }

    return (
      entry.entryType === entryType &&
      normalizePartyName(entry.partyName) === normalizedPartyName &&
      Math.abs(entry.amount - amount) < 0.0001 &&
      formatDateInput(entry.happenedAt) === normalizedDate
    );
  });
};

const buildDocumentAllocationPlan = ({
  amount,
  selectedDueRemoteId,
  settlementCandidates,
  dueEntryByRemoteId,
}: {
  amount: number;
  selectedDueRemoteId: string | null;
  settlementCandidates: readonly {
    remoteId: string;
    outstandingAmount: number;
  }[];
  dueEntryByRemoteId: ReadonlyMap<string, LedgerEntry>;
}): readonly {
  documentRemoteId: string;
  amount: number;
}[] => {
  const documentAmountMap = new Map<string, number>();
  let remainingAmount = Number(amount.toFixed(2));

  const allocateToCandidate = (candidateRemoteId: string, maxAmount: number) => {
    if (remainingAmount <= 0 || maxAmount <= 0) {
      return;
    }
    const dueEntry = dueEntryByRemoteId.get(candidateRemoteId);
    const documentRemoteId = dueEntry?.linkedDocumentRemoteId ?? null;
    if (!documentRemoteId) {
      return;
    }
    const allocatedAmount = Math.min(remainingAmount, maxAmount);
    if (allocatedAmount <= 0) {
      return;
    }
    remainingAmount = Number((remainingAmount - allocatedAmount).toFixed(2));
    documentAmountMap.set(
      documentRemoteId,
      Number(
        (
          (documentAmountMap.get(documentRemoteId) ?? 0) + allocatedAmount
        ).toFixed(2),
      ),
    );
  };

  if (selectedDueRemoteId) {
    const selectedCandidate = settlementCandidates.find(
      (candidate) => candidate.remoteId === selectedDueRemoteId,
    );
    if (selectedCandidate) {
      allocateToCandidate(
        selectedCandidate.remoteId,
        selectedCandidate.outstandingAmount,
      );
    }
  } else {
    for (const candidate of settlementCandidates) {
      if (remainingAmount <= 0) {
        break;
      }
      allocateToCandidate(candidate.remoteId, candidate.outstandingAmount);
    }
  }

  return Array.from(documentAmountMap.entries()).map(([documentRemoteId, allocatedAmount]) => ({
    documentRemoteId,
    amount: allocatedAmount,
  }));
};

export const useLedgerEditorViewModel = ({
  ownerUserRemoteId,
  activeBusinessAccountRemoteId,
  activeBusinessAccountDisplayName,
  activeBusinessCurrencyCode,
  getLedgerEntriesUseCase,
  getLedgerEntryByRemoteIdUseCase,
  addLedgerEntryUseCase,
  updateLedgerEntryUseCase,
  getContactsUseCase,
  saveContactUseCase,
  getMoneyAccountsUseCase,
  postBusinessTransactionUseCase,
  deleteBusinessTransactionUseCase,
  saveBillingDocumentUseCase,
  replaceBillingDocumentAllocationsForSettlementEntryUseCase,
  deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
  onSaved,
}: UseLedgerEditorViewModelParams): LedgerEditorViewModel => {
  const [state, setState] =
    useState<LedgerEditorFormState>(DEFAULT_LEDGER_STATE);
  const [knownParties, setKnownParties] = useState<readonly string[]>([]);
  const [knownLedgerEntries, setKnownLedgerEntries] = useState<readonly LedgerEntry[]>([]);
  const [availableSettlementAccounts, setAvailableSettlementAccounts] = useState<
    readonly LedgerAccountOptionState[]
  >([]);
  const [knownMoneyAccounts, setKnownMoneyAccounts] = useState<readonly MoneyAccount[]>([]);

  const loadMoneyAccounts = useCallback(async () => {
    if (!activeBusinessAccountRemoteId) {
      setAvailableSettlementAccounts([]);
      setKnownMoneyAccounts([]);
      return;
    }

    const moneyAccountsResult = await getMoneyAccountsUseCase.execute(
      activeBusinessAccountRemoteId,
    );
    if (!moneyAccountsResult.success) {
      setAvailableSettlementAccounts([]);
      setKnownMoneyAccounts([]);
      return;
    }

    const activeMoneyAccounts = moneyAccountsResult.value.filter(
      (moneyAccount) => moneyAccount.isActive,
    );
    const sortedActiveMoneyAccounts = [...activeMoneyAccounts].sort((left, right) => {
      if (left.isPrimary && !right.isPrimary) return -1;
      if (!left.isPrimary && right.isPrimary) return 1;
      return left.name.localeCompare(right.name);
    });

    setKnownMoneyAccounts(sortedActiveMoneyAccounts);
    setAvailableSettlementAccounts(
      sortedActiveMoneyAccounts.map(mapMoneyAccountToSettlementOption),
    );

    const defaultSettlementAccountRemoteId =
      sortedActiveMoneyAccounts[0]?.remoteId ?? "";
    setState((currentState) => {
      if (!requiresPaymentMode(currentState.entryType)) {
        return currentState;
      }

      if (currentState.settlementAccountRemoteId.trim().length > 0) {
        return currentState;
      }

      return {
        ...currentState,
        settlementAccountRemoteId: defaultSettlementAccountRemoteId,
      };
    });
  }, [activeBusinessAccountRemoteId, getMoneyAccountsUseCase]);

  const loadKnownParties = useCallback(async () => {
    if (!activeBusinessAccountRemoteId) {
      setKnownParties([]);
      setKnownLedgerEntries([]);
      return;
    }

    const result = await getLedgerEntriesUseCase.execute({
      businessAccountRemoteId: activeBusinessAccountRemoteId,
    });

    if (!result.success) {
      setKnownLedgerEntries([]);
      return;
    }

    const deduped = new Set<string>();
    result.value.forEach((entry) => {
      const name = entry.partyName.trim();
      if (name.length > 0) {
        deduped.add(name);
      }
    });

    setKnownParties(Array.from(deduped.values()).sort((a, b) => a.localeCompare(b)));
    setKnownLedgerEntries(result.value);
  }, [activeBusinessAccountRemoteId, getLedgerEntriesUseCase]);

  const partySuggestions = useMemo(() => {
    const query = state.partyName.trim().toLowerCase();
    if (query.length === 0) {
      return [] as string[];
    }

    return knownParties
      .filter((partyName) => {
        const normalized = partyName.toLowerCase();
        return normalized.includes(query) && normalized !== query;
      })
      .slice(0, 6);
  }, [knownParties, state.partyName]);

  const settlementLinkOptions = useMemo<
    readonly LedgerSettlementLinkOptionState[]
  >(() => {
    const baseOptions = buildSettlementLinkCandidates({
      entries: knownLedgerEntries,
      settlementEntryType: state.entryType,
      partyName: state.partyName,
      fallbackCurrencyCode: activeBusinessCurrencyCode,
    }).map((candidate) => ({
      value: candidate.remoteId,
      label: candidate.label,
    }));

    const selectedRemoteId = state.settledAgainstEntryRemoteId.trim();
    if (!selectedRemoteId) {
      return baseOptions;
    }

    const selectedStillPresent = baseOptions.some(
      (option) => option.value === selectedRemoteId,
    );
    if (selectedStillPresent) {
      return baseOptions;
    }

    return [
      {
        value: selectedRemoteId,
        label: "Previously linked due (settled/closed)",
      },
      ...baseOptions,
    ];
  }, [
    activeBusinessCurrencyCode,
    knownLedgerEntries,
    state.entryType,
    state.partyName,
    state.settledAgainstEntryRemoteId,
  ]);

  const resolveDefaultSettlementAccountRemoteId = useCallback((): string => {
    if (knownMoneyAccounts.length === 0) {
      return "";
    }

    return knownMoneyAccounts[0].remoteId;
  }, [knownMoneyAccounts]);

  const buildCreateState = useCallback(
    (entryType: LedgerEntryTypeValue, partyName = ""): LedgerEditorFormState => {
      return {
        ...DEFAULT_LEDGER_STATE,
        visible: true,
        mode: "create",
        entryType,
        partyName,
        happenedAt: formatDateInput(Date.now()),
        settlementAccountRemoteId: requiresPaymentMode(entryType)
          ? resolveDefaultSettlementAccountRemoteId()
          : "",
      };
    },
    [resolveDefaultSettlementAccountRemoteId],
  );

  const openCreate = useCallback(
    (entryType: LedgerEntryTypeValue) => {
      setState(buildCreateState(entryType));
      void loadKnownParties();
      void loadMoneyAccounts();
    },
    [buildCreateState, loadKnownParties, loadMoneyAccounts],
  );

  const openCreateForParty = useCallback(
    (partyName: string, entryType: LedgerEntryTypeValue) => {
      setState(buildCreateState(entryType, partyName));
      void loadKnownParties();
      void loadMoneyAccounts();
    },
    [buildCreateState, loadKnownParties, loadMoneyAccounts],
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
          fieldErrors: {},
          errorMessage: result.error.message,
        }));
        return;
      }

      const showMoreDetails =
        (result.value.referenceNumber ?? "").trim().length > 0 ||
        (result.value.note ?? "").trim().length > 0 ||
        result.value.reminderAt !== null ||
        (result.value.attachmentUri ?? "").trim().length > 0 ||
        (result.value.settledAgainstEntryRemoteId ?? "").trim().length > 0;

      setState({
        visible: true,
        mode: "edit",
        editingRemoteId: result.value.remoteId,
        entryType: result.value.entryType,
        partyName: result.value.partyName,
        amount: String(result.value.amount),
        happenedAt: formatDateInput(result.value.happenedAt),
        dueAt: formatDateInput(result.value.dueAt),
        settlementAccountRemoteId:
          requiresPaymentMode(result.value.entryType)
            ? (result.value.settlementAccountRemoteId ?? "")
            : "",
        referenceNumber: result.value.referenceNumber ?? "",
        note: result.value.note ?? "",
        reminderAt: formatDateInput(result.value.reminderAt),
        attachmentUri: result.value.attachmentUri ?? "",
        settledAgainstEntryRemoteId: result.value.settledAgainstEntryRemoteId ?? "",
        linkedDocumentRemoteId: result.value.linkedDocumentRemoteId,
        linkedTransactionRemoteId: result.value.linkedTransactionRemoteId,
        showMoreDetails,
        fieldErrors: {},
        isSaving: false,
        errorMessage: null,
      });

      void loadKnownParties();
      void loadMoneyAccounts();
    },
    [getLedgerEntryByRemoteIdUseCase, loadKnownParties, loadMoneyAccounts],
  );

  const close = useCallback(() => {
    setState(DEFAULT_LEDGER_STATE);
  }, []);

  const handleChangeEntryType = useCallback(
    (entryType: LedgerEntryTypeValue) => {
      setState((currentState) => {
        const requiresSettlementAccount = requiresPaymentMode(entryType);

        return {
          ...currentState,
          entryType,
          dueAt: requiresDueDate(entryType) ? currentState.dueAt : "",
          settledAgainstEntryRemoteId: "",
          settlementAccountRemoteId: requiresSettlementAccount
            ? currentState.settlementAccountRemoteId ||
              resolveDefaultSettlementAccountRemoteId()
            : "",
          fieldErrors: {
            ...currentState.fieldErrors,
            dueAt: undefined,
            settlementAccountRemoteId: undefined,
            settledAgainstEntryRemoteId: undefined,
          },
          errorMessage: null,
        };
      });
    },
    [resolveDefaultSettlementAccountRemoteId],
  );

  const handlePickAttachment = useCallback(async () => {
    const pickedImage = await pickImageFromLibrary();

    if (!pickedImage) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      attachmentUri: pickedImage.uri,
      showMoreDetails: true,
      fieldErrors: clearFieldError(currentState.fieldErrors, "reminderAt"),
      errorMessage: null,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const normalizedPartyName = state.partyName.trim();
    const amount = Number(state.amount);
    const happenedAt = parseDateInput(state.happenedAt);
    const dueAt = parseDateInput(state.dueAt);
    const reminderAt = parseDateInput(state.reminderAt);
    const nextFieldErrors: LedgerEditorFieldErrors = {};

    if (!normalizedPartyName) {
      nextFieldErrors.partyName = "Party name is required.";
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      nextFieldErrors.amount = "Amount must be greater than zero.";
    }

    if (happenedAt === null) {
      nextFieldErrors.happenedAt = "Enter a valid date in YYYY-MM-DD format.";
    }

    if (requiresDueDate(state.entryType) && dueAt === null) {
      nextFieldErrors.dueAt = "Due date is required for this action.";
    }

    if (!requiresDueDate(state.entryType) && state.dueAt.trim().length > 0 && dueAt === null) {
      nextFieldErrors.dueAt = "Enter a valid due date in YYYY-MM-DD format.";
    }

    if (
      requiresPaymentMode(state.entryType) &&
      state.settlementAccountRemoteId.trim().length === 0
    ) {
      nextFieldErrors.settlementAccountRemoteId =
        "Money account is required for this action.";
    }

    if (state.reminderAt.trim().length > 0 && reminderAt === null) {
      nextFieldErrors.reminderAt = "Enter a valid reminder date in YYYY-MM-DD format.";
    }

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setState((currentState) => ({
        ...currentState,
        fieldErrors: nextFieldErrors,
        errorMessage: null,
      }));
      return;
    }

    const businessAccountRemoteId = activeBusinessAccountRemoteId ?? "";

    if (!businessAccountRemoteId) {
      setState((currentState) => ({
        ...currentState,
        fieldErrors: {},
        errorMessage: "Business account context is required.",
      }));
      return;
    }

    const duplicateCheckResult = await getLedgerEntriesUseCase.execute({
      businessAccountRemoteId,
    });

    if (!duplicateCheckResult.success) {
      setState((currentState) => ({
        ...currentState,
        fieldErrors: {},
        errorMessage: duplicateCheckResult.error.message,
      }));
      return;
    }

    if (
      isLikelyDuplicate({
        entries: duplicateCheckResult.value,
        editingRemoteId: state.mode === "edit" ? state.editingRemoteId : null,
        entryType: state.entryType,
        partyName: normalizedPartyName,
        amount,
        happenedAtInput: state.happenedAt,
      })
    ) {
      setState((currentState) => ({
        ...currentState,
        fieldErrors: {
          ...currentState.fieldErrors,
          partyName: "A similar entry already exists for this party/date/amount.",
        },
        errorMessage: null,
      }));
      return;
    }

    const isSettlementAction = requiresPaymentMode(state.entryType);
    const isDueAction = requiresDueDate(state.entryType);
    const settlementCandidates = buildSettlementLinkCandidates({
      entries: duplicateCheckResult.value,
      settlementEntryType: state.entryType,
      partyName: normalizedPartyName,
      fallbackCurrencyCode: activeBusinessCurrencyCode,
    });
    const settlementCandidatesById = new Map(
      settlementCandidates.map((candidate) => [candidate.remoteId, candidate]),
    );
    let resolvedSettledAgainstEntryRemoteId = isSettlementAction
      ? state.settledAgainstEntryRemoteId.trim() || null
      : null;

    if (isSettlementAction) {
      const totalOutstandingAmount = settlementCandidates.reduce(
        (total, candidate) => total + candidate.outstandingAmount,
        0,
      );

      if (totalOutstandingAmount > 0 && amount > totalOutstandingAmount + 0.0001) {
        nextFieldErrors.amount =
          "Amount is more than pending due for this party. Use a due action for advance.";
      }

      if (resolvedSettledAgainstEntryRemoteId) {
        const linkedCandidate = settlementCandidatesById.get(
          resolvedSettledAgainstEntryRemoteId,
        );

        if (!linkedCandidate) {
          nextFieldErrors.settledAgainstEntryRemoteId =
            "Selected bill/due is already settled. Choose another one.";
        } else if (amount > linkedCandidate.outstandingAmount + 0.0001) {
          nextFieldErrors.settledAgainstEntryRemoteId =
            "Amount cannot exceed pending amount of selected bill/due.";
        }
      } else if (settlementCandidates.length === 1) {
        resolvedSettledAgainstEntryRemoteId = settlementCandidates[0].remoteId;
      }
    }

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setState((currentState) => ({
        ...currentState,
        fieldErrors: nextFieldErrors,
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

    const resolvedDueAt =
      isDueAction
        ? (dueAt as number)
        : state.dueAt.trim().length === 0
          ? null
          : dueAt;
    const resolvedHappenedAt = happenedAt as number;
    const resolvedReminderAt = state.reminderAt.trim().length === 0 ? null : reminderAt;
    const selectedSettlementAccountRemoteId = state.settlementAccountRemoteId.trim();
    let settlementMoneyAccountRemoteId: string | null = null;
    let settlementMoneyAccountDisplayNameSnapshot: string | null = null;
    let resolvedPaymentMode: SaveLedgerEntryPayload["paymentMode"] = null;

    const resolvedCurrencyCode = resolveCurrencyCode({
      currencyCode: activeBusinessCurrencyCode,
    });

    const transactionNote = state.note.trim() || null;
    const ledgerRemoteId =
      state.mode === "create" ? createLedgerRemoteId() : (state.editingRemoteId ?? "");
    if (!ledgerRemoteId) {
      setState((currentState) => ({
        ...currentState,
        isSaving: false,
        fieldErrors: {},
        errorMessage: "Ledger entry id is missing.",
      }));
      return;
    }
    const shouldSyncTransaction = isSettlementAction;
    let linkedTransactionRemoteId = state.linkedTransactionRemoteId;
    let linkedDocumentRemoteId = isDueAction ? state.linkedDocumentRemoteId : null;
    let createdTransactionRemoteId: string | null = null;
    let transactionToDeleteAfterSave: string | null = null;
    let hasPreparedSettlementAllocations = false;

    if (shouldSyncTransaction) {
      const moneyAccountsResult = await getMoneyAccountsUseCase.execute(
        businessAccountRemoteId,
      );
      if (!moneyAccountsResult.success) {
        setState((currentState) => ({
          ...currentState,
          isSaving: false,
          fieldErrors: {},
          errorMessage: moneyAccountsResult.error.message,
        }));
        return;
      }

      const activeMoneyAccounts = moneyAccountsResult.value.filter(
        (moneyAccount) => moneyAccount.isActive,
      );
      const settlementMoneyAccount = activeMoneyAccounts.find(
        (moneyAccount) => moneyAccount.remoteId === selectedSettlementAccountRemoteId,
      );
      if (!settlementMoneyAccount) {
        setState((currentState) => ({
          ...currentState,
          isSaving: false,
          fieldErrors: {
            ...currentState.fieldErrors,
            settlementAccountRemoteId: "Choose a valid active money account.",
          },
          errorMessage: null,
        }));
        return;
      }

      settlementMoneyAccountRemoteId = settlementMoneyAccount.remoteId;
      settlementMoneyAccountDisplayNameSnapshot = settlementMoneyAccount.name;
      resolvedPaymentMode = derivePaymentModeFromMoneyAccount(settlementMoneyAccount);
    }

    const contactsResult = await getContactsUseCase.execute({
      accountRemoteId: businessAccountRemoteId,
    });
    if (!contactsResult.success) {
      setState((currentState) => ({
        ...currentState,
        isSaving: false,
        fieldErrors: {},
        errorMessage: contactsResult.error.message,
      }));
      return;
    }

    const existingPartyContact = contactsResult.value.find(
      (contact) => normalizePartyName(contact.fullName) === normalizePartyName(normalizedPartyName),
    );
    if (!existingPartyContact) {
      const saveContactResult = await saveContactUseCase.execute({
        remoteId: createContactRemoteId(),
        ownerUserRemoteId,
        accountRemoteId: businessAccountRemoteId,
        accountType: AccountType.Business,
        contactType: resolveContactTypeForEntryType(state.entryType),
        fullName: normalizedPartyName,
        phoneNumber: null,
        emailAddress: null,
        address: null,
        taxId: null,
        openingBalanceAmount: 0,
        openingBalanceDirection: null,
        notes: null,
        isArchived: false,
      });
      if (!saveContactResult.success) {
        setState((currentState) => ({
          ...currentState,
          isSaving: false,
          fieldErrors: {},
          errorMessage: saveContactResult.error.message,
        }));
        return;
      }
    }

    if (shouldSyncTransaction) {
      const transactionRemoteId = linkedTransactionRemoteId ?? createTransactionRemoteId();
      const transactionPayload = buildSettlementTransactionPayload({
        remoteId: transactionRemoteId,
        ownerUserRemoteId,
        businessAccountRemoteId,
        businessAccountDisplayName: activeBusinessAccountDisplayName,
        entryType: state.entryType,
        partyName: normalizedPartyName,
        amount,
        currencyCode: resolvedCurrencyCode,
        note: transactionNote,
        happenedAt: resolvedHappenedAt,
        sourceRemoteId: ledgerRemoteId,
        settlementMoneyAccountRemoteId,
        settlementMoneyAccountDisplayNameSnapshot,
      });

      const transactionResult = await postBusinessTransactionUseCase.execute(transactionPayload);

      if (!transactionResult.success) {
        setState((currentState) => ({
          ...currentState,
          isSaving: false,
          fieldErrors: {},
          errorMessage: transactionResult.error.message,
        }));
        return;
      }

      if (!linkedTransactionRemoteId) {
        linkedTransactionRemoteId = transactionRemoteId;
        createdTransactionRemoteId = transactionRemoteId;
      }
    } else if (linkedTransactionRemoteId) {
      transactionToDeleteAfterSave = linkedTransactionRemoteId;
      linkedTransactionRemoteId = null;
    }

    if (isDueAction) {
      const nextLinkedDocumentRemoteId =
        linkedDocumentRemoteId ?? createBillingDocumentRemoteId();
      const saveDocumentResult = await saveBillingDocumentUseCase.execute({
        remoteId: nextLinkedDocumentRemoteId,
        accountRemoteId: businessAccountRemoteId,
        documentNumber: buildLedgerDocumentNumber({
          entryType: state.entryType,
          remoteId: ledgerRemoteId,
          happenedAt: resolvedHappenedAt,
        }),
        documentType: resolveBillingDocumentTypeForEntryType(state.entryType),
        templateType: resolveBillingTemplateTypeForEntryType(state.entryType),
        customerName: normalizedPartyName,
        status: BillingDocumentStatus.Pending,
        taxRatePercent: 0,
        notes: transactionNote,
        issuedAt: resolvedHappenedAt,
        dueAt: resolvedDueAt,
        sourceModule: TransactionSourceModule.Ledger,
        sourceRemoteId: ledgerRemoteId,
        linkedLedgerEntryRemoteId: ledgerRemoteId,
        items: [
          {
            remoteId: `${ledgerRemoteId}-line-1`,
            itemName: buildLedgerDocumentItemName(state.entryType),
            quantity: 1,
            unitRate: amount,
            lineOrder: 0,
          },
        ],
      });

      if (!saveDocumentResult.success) {
        if (createdTransactionRemoteId) {
          await deleteBusinessTransactionUseCase.execute(createdTransactionRemoteId);
        }
        setState((currentState) => ({
          ...currentState,
          isSaving: false,
          fieldErrors: {},
          errorMessage: saveDocumentResult.error.message,
        }));
        return;
      }

      linkedDocumentRemoteId = saveDocumentResult.value.remoteId;
    } else {
      linkedDocumentRemoteId = null;
    }

    if (isSettlementAction) {
      const dueEntryByRemoteId = new Map<string, LedgerEntry>(
        duplicateCheckResult.value
          .filter((entry) => requiresDueDate(entry.entryType))
          .map((entry) => [entry.remoteId, entry]),
      );
      const allocationPlan = buildDocumentAllocationPlan({
        amount,
        selectedDueRemoteId: resolvedSettledAgainstEntryRemoteId,
        settlementCandidates,
        dueEntryByRemoteId,
      });

      const replaceAllocationsResult =
        await replaceBillingDocumentAllocationsForSettlementEntryUseCase.execute({
          accountRemoteId: businessAccountRemoteId,
          settlementLedgerEntryRemoteId: ledgerRemoteId,
          settlementTransactionRemoteId: linkedTransactionRemoteId,
          settledAt: resolvedHappenedAt,
          note: transactionNote,
          allocations: allocationPlan,
        });

      if (!replaceAllocationsResult.success) {
        if (createdTransactionRemoteId) {
          await deleteBusinessTransactionUseCase.execute(createdTransactionRemoteId);
        }
        setState((currentState) => ({
          ...currentState,
          isSaving: false,
          fieldErrors: {},
          errorMessage: replaceAllocationsResult.error.message,
        }));
        return;
      }

      hasPreparedSettlementAllocations = true;
    }

    const payload: SaveLedgerEntryPayload = {
      remoteId: ledgerRemoteId,
      businessAccountRemoteId,
      ownerUserRemoteId,
      partyName: normalizedPartyName,
      partyPhone: null,
      entryType: state.entryType,
      balanceDirection: resolveDefaultDirectionForEntryType(state.entryType),
      title: buildAutoTitle(state.entryType, normalizedPartyName),
      amount,
      currencyCode: resolvedCurrencyCode,
      note: transactionNote,
      happenedAt: resolvedHappenedAt,
      dueAt: resolvedDueAt,
      paymentMode: resolvedPaymentMode,
      referenceNumber: state.referenceNumber.trim() || null,
      reminderAt: resolvedReminderAt,
      attachmentUri: state.attachmentUri.trim() || null,
      settledAgainstEntryRemoteId: resolvedSettledAgainstEntryRemoteId,
      linkedDocumentRemoteId,
      linkedTransactionRemoteId,
      settlementAccountRemoteId: settlementMoneyAccountRemoteId,
      settlementAccountDisplayNameSnapshot: settlementMoneyAccountDisplayNameSnapshot,
    };

    const result =
      state.mode === "create"
        ? await addLedgerEntryUseCase.execute(payload)
        : await updateLedgerEntryUseCase.execute(payload);

    if (!result.success) {
      if (createdTransactionRemoteId) {
        await deleteBusinessTransactionUseCase.execute(createdTransactionRemoteId);
      }
      if (hasPreparedSettlementAllocations) {
        await deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase.execute(
          ledgerRemoteId,
        );
      }

      setState((currentState) => ({
        ...currentState,
        isSaving: false,
        fieldErrors: {},
        errorMessage: result.error.message,
      }));
      return;
    }

    if (transactionToDeleteAfterSave) {
      await deleteBusinessTransactionUseCase.execute(transactionToDeleteAfterSave);
    }
    if (!isSettlementAction) {
      await deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase.execute(
        ledgerRemoteId,
      );
    }

    close();
    onSaved();
  }, [
    activeBusinessAccountDisplayName,
    activeBusinessAccountRemoteId,
    activeBusinessCurrencyCode,
    addLedgerEntryUseCase,
    saveBillingDocumentUseCase,
    replaceBillingDocumentAllocationsForSettlementEntryUseCase,
    postBusinessTransactionUseCase,
    close,
    getContactsUseCase,
    getMoneyAccountsUseCase,
    saveContactUseCase,
    deleteBusinessTransactionUseCase,
    deleteBillingDocumentAllocationsBySettlementEntryRemoteIdUseCase,
    getLedgerEntriesUseCase,
    onSaved,
    ownerUserRemoteId,
    state.amount,
    state.attachmentUri,
    state.dueAt,
    state.editingRemoteId,
    state.entryType,
    state.happenedAt,
    state.linkedDocumentRemoteId,
    state.linkedTransactionRemoteId,
    state.mode,
    state.note,
    state.partyName,
    state.referenceNumber,
    state.reminderAt,
    state.settlementAccountRemoteId,
    state.settledAgainstEntryRemoteId,
    updateLedgerEntryUseCase,
  ]);

  return useMemo(
    () => ({
      state,
      partySuggestions,
      availableEntryTypes: entryTypeOptions,
      availableSettlementAccounts,
      settlementLinkOptions,
      openCreate,
      openCreateForParty,
      openEdit,
      close,
      onChangeEntryType: handleChangeEntryType,
      onSelectPartySuggestion: (partyName: string) =>
        setState((currentState) => ({
          ...currentState,
          partyName,
          settledAgainstEntryRemoteId: "",
          fieldErrors: {
            ...currentState.fieldErrors,
            partyName: undefined,
            settledAgainstEntryRemoteId: undefined,
          },
          errorMessage: null,
        })),
      onChangePartyName: (partyName: string) =>
        setState((currentState) => ({
          ...currentState,
          partyName,
          settledAgainstEntryRemoteId: "",
          fieldErrors: {
            ...currentState.fieldErrors,
            partyName: undefined,
            settledAgainstEntryRemoteId: undefined,
          },
          errorMessage: null,
        })),
      onChangeAmount: (amount: string) =>
        setState((currentState) => ({
          ...currentState,
          amount,
          fieldErrors: {
            ...currentState.fieldErrors,
            amount: undefined,
            settledAgainstEntryRemoteId: undefined,
          },
          errorMessage: null,
        })),
      onChangeHappenedAt: (happenedAt: string) =>
        setState((currentState) => ({
          ...currentState,
          happenedAt,
          fieldErrors: {
            ...currentState.fieldErrors,
            happenedAt: undefined,
          },
          errorMessage: null,
        })),
      onChangeDueAt: (dueAt: string) =>
        setState((currentState) => ({
          ...currentState,
          dueAt,
          fieldErrors: {
            ...currentState.fieldErrors,
            dueAt: undefined,
          },
          errorMessage: null,
        })),
      onChangeSettlementAccountRemoteId: (settlementAccountRemoteId: string) =>
        setState((currentState) => ({
          ...currentState,
          settlementAccountRemoteId,
          fieldErrors: {
            ...currentState.fieldErrors,
            settlementAccountRemoteId: undefined,
          },
          errorMessage: null,
        })),
      onChangeSettledAgainstEntryRemoteId: (settledAgainstEntryRemoteId: string) =>
        setState((currentState) => ({
          ...currentState,
          settledAgainstEntryRemoteId,
          fieldErrors: {
            ...currentState.fieldErrors,
            settledAgainstEntryRemoteId: undefined,
          },
          errorMessage: null,
        })),
      onChangeReferenceNumber: (referenceNumber: string) =>
        setState((currentState) => ({
          ...currentState,
          referenceNumber,
          errorMessage: null,
        })),
      onChangeNote: (note: string) =>
        setState((currentState) => ({
          ...currentState,
          note,
          errorMessage: null,
        })),
      onChangeReminderAt: (reminderAt: string) =>
        setState((currentState) => ({
          ...currentState,
          reminderAt,
          fieldErrors: {
            ...currentState.fieldErrors,
            reminderAt: undefined,
          },
          errorMessage: null,
        })),
      onToggleMoreDetails: () =>
        setState((currentState) => ({
          ...currentState,
          showMoreDetails: !currentState.showMoreDetails,
        })),
      pickAttachment: handlePickAttachment,
      clearAttachment: () =>
        setState((currentState) => ({
          ...currentState,
          attachmentUri: "",
          errorMessage: null,
        })),
      submit: handleSubmit,
    }),
    [
      close,
      handleChangeEntryType,
      handlePickAttachment,
      handleSubmit,
      openCreate,
      openCreateForParty,
      openEdit,
      availableSettlementAccounts,
      partySuggestions,
      settlementLinkOptions,
      state,
    ],
  );
};

