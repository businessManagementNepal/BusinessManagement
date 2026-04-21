import { Result } from "../../../shared/types/result.types";
import { AccountTypeValue } from "../../auth/accountSelection/types/accountSelection.types";

export const ContactType = {
  Customer: "customer",
  Supplier: "supplier",
  Other: "other",
  Friend: "friend",
  Family: "family",
  Borrower: "borrower",
  Lender: "lender",
  Landlord: "landlord",
  ServiceProvider: "service_provider",
  Institution: "institution",
} as const;

export type ContactTypeValue = (typeof ContactType)[keyof typeof ContactType];

export const ContactBalanceDirection = {
  Receive: "receive",
  Pay: "pay",
} as const;

export type ContactBalanceDirectionValue =
  (typeof ContactBalanceDirection)[keyof typeof ContactBalanceDirection];

export type Contact = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  accountType: AccountTypeValue;
  contactType: ContactTypeValue;
  fullName: string;
  phoneNumber: string | null;
  emailAddress: string | null;
  address: string | null;
  taxId: string | null;
  openingBalanceAmount: number;
  openingBalanceDirection: ContactBalanceDirectionValue | null;
  notes: string | null;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
};

export type SaveContactPayload = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountRemoteId: string;
  accountType: AccountTypeValue;
  contactType: ContactTypeValue;
  fullName: string;
  phoneNumber: string | null;
  emailAddress: string | null;
  address: string | null;
  taxId: string | null;
  openingBalanceAmount: number;
  openingBalanceDirection: ContactBalanceDirectionValue | null;
  notes: string | null;
  isArchived: boolean;
};

export type ContactScopedReference = {
  remoteId: string;
  accountRemoteId: string;
};

export const ContactErrorType = {
  DatabaseError: "DATABASE_ERROR",
  ValidationError: "VALIDATION_ERROR",
  ContactNotFound: "CONTACT_NOT_FOUND",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type ContactError = {
  type: (typeof ContactErrorType)[keyof typeof ContactErrorType];
  message: string;
};

export const ContactDatabaseError: ContactError = {
  type: ContactErrorType.DatabaseError,
  message: "Unable to process the contact right now. Please try again.",
};

export const ContactValidationError = (message: string): ContactError => ({
  type: ContactErrorType.ValidationError,
  message,
});

export const ContactNotFoundError: ContactError = {
  type: ContactErrorType.ContactNotFound,
  message: "The requested contact was not found.",
};

export const ContactUnknownError: ContactError = {
  type: ContactErrorType.UnknownError,
  message: "An unexpected contact error occurred.",
};

export type ContactResult = Result<Contact, ContactError>;
export type ContactsResult = Result<Contact[], ContactError>;
export type ContactOperationResult = Result<boolean, ContactError>;

export const BUSINESS_CONTACT_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: ContactType.Customer, label: "Customers" },
  { value: ContactType.Supplier, label: "Suppliers" },
  { value: ContactType.Other, label: "Others" },
] as const;

export const PERSONAL_CONTACT_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: ContactType.Friend, label: "Friends" },
  { value: ContactType.Family, label: "Family" },
  { value: ContactType.Borrower, label: "Borrowers" },
  { value: ContactType.Lender, label: "Lenders" },
  { value: ContactType.Landlord, label: "Landlords" },
  { value: ContactType.ServiceProvider, label: "Services" },
  { value: ContactType.Institution, label: "Institutions" },
] as const;

export const BUSINESS_CONTACT_TYPE_OPTIONS = [
  { value: ContactType.Customer, label: "Customer" },
  { value: ContactType.Supplier, label: "Supplier" },
  { value: ContactType.Other, label: "Others" },
] as const;

export const PERSONAL_CONTACT_TYPE_OPTIONS = [
  { value: ContactType.Friend, label: "Friend" },
  { value: ContactType.Family, label: "Family" },
  { value: ContactType.Borrower, label: "Borrower" },
  { value: ContactType.Lender, label: "Lender" },
  { value: ContactType.Landlord, label: "Landlord" },
  { value: ContactType.ServiceProvider, label: "Service Provider" },
  { value: ContactType.Institution, label: "Institution" },
] as const;

export const getContactTypeLabel = (contactType: ContactTypeValue): string => {
  switch (contactType) {
    case ContactType.Customer:
      return "Customer";
    case ContactType.Supplier:
      return "Supplier";
    case ContactType.Other:
      return "Others";
    case ContactType.Friend:
      return "Friend";
    case ContactType.Family:
      return "Family";
    case ContactType.Borrower:
      return "Borrower";
    case ContactType.Lender:
      return "Lender";
    case ContactType.Landlord:
      return "Landlord";
    case ContactType.ServiceProvider:
      return "Service Provider";
    case ContactType.Institution:
      return "Institution";
    default:
      return "Contact";
  }
};
