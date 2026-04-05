import {
  BUSINESS_CONTACT_FILTER_OPTIONS,
  BUSINESS_CONTACT_TYPE_OPTIONS,
  Contact,
  ContactBalanceDirection,
  ContactType,
  PERSONAL_CONTACT_FILTER_OPTIONS,
  PERSONAL_CONTACT_TYPE_OPTIONS,
} from "@/feature/contacts/types/contact.types";
import { GetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase";
import { SaveContactUseCase } from "@/feature/contacts/useCase/saveContact.useCase";
import {
  AccountType,
  AccountTypeValue,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContactsViewModel, ContactFormState, ContactFilterValue } from "./contacts.viewModel";
import {
  formatCurrencyAmount,
  resolveCurrencyCode,
  resolveCurrencyPrefix,
} from "@/shared/utils/currency/accountCurrency";

const EMPTY_FORM: ContactFormState = {
  remoteId: null,
  fullName: "",
  contactType: ContactType.Customer,
  phoneNumber: "",
  emailAddress: "",
  address: "",
  taxId: "",
  openingBalance: "0",
  notes: "",
};

const formatSignedOpeningBalance = (contact: Contact): string => {
  if (!contact.openingBalanceAmount) {
    return "";
  }

  return contact.openingBalanceDirection === ContactBalanceDirection.Pay
    ? `-${contact.openingBalanceAmount}`
    : `${contact.openingBalanceAmount}`;
};

const mapContactToForm = (contact: Contact): ContactFormState => ({
  remoteId: contact.remoteId,
  fullName: contact.fullName,
  contactType: contact.contactType,
  phoneNumber: contact.phoneNumber ?? "",
  emailAddress: contact.emailAddress ?? "",
  address: contact.address ?? "",
  taxId: contact.taxId ?? "",
  openingBalance: formatSignedOpeningBalance(contact),
  notes: contact.notes ?? "",
});

const normalizeSearchableText = (value: string | null): string =>
  (value ?? "").trim().toLowerCase();

const parseOpeningBalance = (value: string): {
  amount: number;
  direction: Contact["openingBalanceDirection"];
} | null => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return {
      amount: 0,
      direction: null,
    };
  }

  const parsedValue = Number(normalizedValue);
  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  if (parsedValue === 0) {
    return {
      amount: 0,
      direction: null,
    };
  }

  return {
    amount: Math.abs(parsedValue),
    direction:
      parsedValue > 0
        ? ContactBalanceDirection.Receive
        : ContactBalanceDirection.Pay,
  };
};

type UseContactsViewModelParams = {
  ownerUserRemoteId: string | null;
  accountRemoteId: string | null;
  accountType: AccountTypeValue | null;
  canManage: boolean;
  currencyCode?: string | null;
  countryCode?: string | null;
  getContactsUseCase: GetContactsUseCase;
  saveContactUseCase: SaveContactUseCase;
};

export const useContactsViewModel = ({
  ownerUserRemoteId,
  accountRemoteId,
  accountType,
  canManage,
  currencyCode,
  countryCode,
  getContactsUseCase,
  saveContactUseCase,
}: UseContactsViewModelParams): ContactsViewModel => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [contacts, setContacts] = useState<readonly Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<ContactFilterValue>("all");
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<ContactFormState>(EMPTY_FORM);

  const filterOptions = useMemo(() => {
    return accountType === AccountType.Personal
      ? PERSONAL_CONTACT_FILTER_OPTIONS
      : BUSINESS_CONTACT_FILTER_OPTIONS;
  }, [accountType]);

  const typeOptions = useMemo(() => {
    return accountType === AccountType.Personal
      ? PERSONAL_CONTACT_TYPE_OPTIONS
      : BUSINESS_CONTACT_TYPE_OPTIONS;
  }, [accountType]);

  const resolvedCurrencyCode = useMemo(
    () => resolveCurrencyCode({ currencyCode, countryCode }),
    [countryCode, currencyCode],
  );

  const currencyPrefix = useMemo(
    () => resolveCurrencyPrefix({ currencyCode: resolvedCurrencyCode, countryCode }),
    [countryCode, resolvedCurrencyCode],
  );

  const loadContacts = useCallback(async (): Promise<void> => {
    if (!accountRemoteId) {
      setContacts([]);
      setErrorMessage("An active account is required to manage contacts.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const result = await getContactsUseCase.execute({
      accountRemoteId,
    });

    if (!result.success) {
      setContacts([]);
      setErrorMessage(result.error.message);
      setIsLoading(false);
      return;
    }

    setContacts(result.value);
    setErrorMessage(null);
    setIsLoading(false);
  }, [accountRemoteId, getContactsUseCase]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const filteredContacts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return contacts.filter((contact) => {
      const matchesFilter =
        selectedFilter === "all" || contact.contactType === selectedFilter;
      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        contact.fullName,
        contact.phoneNumber,
        contact.emailAddress,
        contact.address,
        contact.taxId,
        contact.notes,
      ].some((candidate) =>
        normalizeSearchableText(candidate).includes(normalizedSearch),
      );
    });
  }, [contacts, searchQuery, selectedFilter]);

  const summary = useMemo(() => {
    const receiveTotal = contacts.reduce((sum, contact) => {
      return contact.openingBalanceDirection === ContactBalanceDirection.Receive
        ? sum + contact.openingBalanceAmount
        : sum;
    }, 0);

    const payTotal = contacts.reduce((sum, contact) => {
      return contact.openingBalanceDirection === ContactBalanceDirection.Pay
        ? sum + contact.openingBalanceAmount
        : sum;
    }, 0);

    return {
      totalCount: contacts.length,
      receiveAmountLabel: formatCurrencyAmount({
        amount: receiveTotal,
        currencyCode: resolvedCurrencyCode,
        countryCode,
      }),
      payAmountLabel: formatCurrencyAmount({
        amount: payTotal,
        currencyCode: resolvedCurrencyCode,
        countryCode,
      }),
    };
  }, [contacts, countryCode, resolvedCurrencyCode]);

  const onOpenCreate = useCallback(() => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage contacts.");
      return;
    }

    const defaultType = typeOptions[0]?.value ?? ContactType.Customer;
    setEditorMode("create");
    setForm({
      ...EMPTY_FORM,
      contactType: defaultType,
    });
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, [canManage, typeOptions]);

  const onOpenEdit = useCallback((contact: Contact) => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage contacts.");
      return;
    }

    setEditorMode("edit");
    setForm(mapContactToForm(contact));
    setErrorMessage(null);
    setIsEditorVisible(true);
  }, [canManage]);

  const onCloseEditor = useCallback(() => {
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
  }, []);

  const onFormChange = useCallback((field: keyof ContactFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const onSubmit = useCallback(async () => {
    if (!canManage) {
      setErrorMessage("You do not have permission to manage contacts.");
      return;
    }

    if (!ownerUserRemoteId || !accountRemoteId || !accountType) {
      setErrorMessage("An active account is required to manage contacts.");
      return;
    }

    const parsedOpeningBalance = parseOpeningBalance(form.openingBalance);
    if (!parsedOpeningBalance) {
      setErrorMessage(
        "Opening balance is invalid. Use a positive amount for receive or a negative amount for pay.",
      );
      return;
    }

    const result = await saveContactUseCase.execute({
      remoteId: form.remoteId ?? Crypto.randomUUID(),
      ownerUserRemoteId,
      accountRemoteId,
      accountType,
      contactType: form.contactType,
      fullName: form.fullName,
      phoneNumber: form.phoneNumber || null,
      emailAddress: form.emailAddress || null,
      address: form.address || null,
      taxId: form.taxId || null,
      openingBalanceAmount: parsedOpeningBalance.amount,
      openingBalanceDirection: parsedOpeningBalance.direction,
      notes: form.notes || null,
      isArchived: false,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      return;
    }

    setContacts((currentContacts) => {
      const existingIndex = currentContacts.findIndex(
        (contact) => contact.remoteId === result.value.remoteId,
      );
      if (existingIndex === -1) {
        return [result.value, ...currentContacts];
      }
      return currentContacts.map((contact, index) =>
        index === existingIndex ? result.value : contact,
      );
    });
    setErrorMessage(null);
    setIsEditorVisible(false);
    setForm(EMPTY_FORM);
    void loadContacts();
  }, [
    accountRemoteId,
    accountType,
    canManage,
    form,
    loadContacts,
    ownerUserRemoteId,
    saveContactUseCase,
  ]);

  useEffect(() => {
    const allowedFilterValues = new Set(filterOptions.map((item) => item.value));
    if (!allowedFilterValues.has(selectedFilter)) {
      setSelectedFilter("all");
    }
  }, [filterOptions, selectedFilter]);

  const getContactAmountTone = useCallback((contact: Contact) => {
    if (!contact.openingBalanceAmount) {
      return null;
    }

    return contact.openingBalanceDirection;
  }, []);

  return useMemo<ContactsViewModel>(
    () => ({
      isLoading,
      errorMessage,
      contacts,
      filteredContacts,
      currencyPrefix,
      openingBalancePlaceholder: `Opening Balance (${currencyPrefix})`,
      selectedFilter,
      searchQuery,
      summary,
      canManage:
        Boolean(ownerUserRemoteId && accountRemoteId && accountType) &&
        canManage,
      isEditorVisible,
      editorMode,
      editorTitle: editorMode === "create" ? "New Contact" : "Edit Contact",
      form,
      filterOptions,
      typeOptions,
      onRefresh: loadContacts,
      onSearchChange: setSearchQuery,
      onFilterChange: setSelectedFilter,
      onOpenCreate,
      onOpenEdit,
      onCloseEditor,
      onFormChange,
      onSubmit,
      getContactAmountTone,
    }),
    [
      accountRemoteId,
      accountType,
      canManage,
      contacts,
      editorMode,
      errorMessage,
      filterOptions,
      filteredContacts,
      form,
      getContactAmountTone,
      currencyPrefix,
      isEditorVisible,
      isLoading,
      loadContacts,
      onCloseEditor,
      onFormChange,
      onOpenCreate,
      onOpenEdit,
      onSubmit,
      ownerUserRemoteId,
      searchQuery,
      selectedFilter,
      summary,
      typeOptions,
    ],
  );
};
