import {
  BUSINESS_CONTACT_FILTER_OPTIONS,
  BUSINESS_CONTACT_TYPE_OPTIONS,
  Contact,
  ContactBalanceDirectionValue,
  ContactTypeValue,
  PERSONAL_CONTACT_FILTER_OPTIONS,
  PERSONAL_CONTACT_TYPE_OPTIONS,
} from "@/feature/contacts/types/contact.types";

export type ContactFilterValue =
  | "all"
  | ContactTypeValue;

export type ContactSummaryState = {
  totalCount: number;
  receiveAmountLabel: string;
  payAmountLabel: string;
};

export type ContactFormState = {
  remoteId: string | null;
  fullName: string;
  contactType: ContactTypeValue;
  phoneNumber: string;
  emailAddress: string;
  address: string;
  taxId: string;
  openingBalance: string;
  notes: string;
};

export interface ContactsViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  contacts: readonly Contact[];
  filteredContacts: readonly Contact[];
  currencyPrefix: string;
  openingBalancePlaceholder: string;
  selectedFilter: ContactFilterValue;
  searchQuery: string;
  summary: ContactSummaryState;
  canManage: boolean;
  isEditorVisible: boolean;
  editorMode: "create" | "edit";
  editorTitle: string;
  form: ContactFormState;
  filterOptions:
    | typeof BUSINESS_CONTACT_FILTER_OPTIONS
    | typeof PERSONAL_CONTACT_FILTER_OPTIONS;
  typeOptions:
    | typeof BUSINESS_CONTACT_TYPE_OPTIONS
    | typeof PERSONAL_CONTACT_TYPE_OPTIONS;
  onRefresh: () => Promise<void>;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: ContactFilterValue) => void;
  onOpenCreate: () => void;
  onOpenEdit: (contact: Contact) => void;
  onCloseEditor: () => void;
  onFormChange: (field: keyof ContactFormState, value: string) => void;
  onSubmit: () => Promise<void>;
  getContactAmountTone: (
    contact: Contact,
  ) => ContactBalanceDirectionValue | null;
}
