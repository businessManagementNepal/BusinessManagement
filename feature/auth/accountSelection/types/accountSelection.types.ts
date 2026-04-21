import { BusinessTypeValue } from "../../../../shared/constants/businessType.constants";
import { TaxModeValue } from "../../../../shared/types/regionalFinance.types";
import { Result } from "../../../../shared/types/result.types";

export const AccountType = {
  Personal: "personal",
  Business: "business",
} as const;

export type AccountTypeValue = (typeof AccountType)[keyof typeof AccountType];

export const AccountSyncStatus = {
  PendingCreate: "pending_create",
  PendingUpdate: "pending_update",
  PendingDelete: "pending_delete",
  Synced: "synced",
  Failed: "failed",
} as const;

export type AccountSyncStatusValue =
  (typeof AccountSyncStatus)[keyof typeof AccountSyncStatus];

export type SaveAccountPayload = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountType: AccountTypeValue;
  businessType: BusinessTypeValue | null;
  displayName: string;
  currencyCode: string | null;
  cityOrLocation: string | null;
  countryCode: string | null;
  defaultTaxRatePercent?: number | null;
  defaultTaxMode?: TaxModeValue | null;
  isActive: boolean;
  isDefault: boolean;
};

export type Account = {
  remoteId: string;
  ownerUserRemoteId: string;
  accountType: AccountTypeValue;
  businessType: BusinessTypeValue | null;
  displayName: string;
  currencyCode: string | null;
  cityOrLocation: string | null;
  countryCode: string | null;
  defaultTaxRatePercent?: number | null;
  defaultTaxMode?: TaxModeValue | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
};

export type SelectedAccountContext = {
  accountRemoteId: string;
  accountType: AccountTypeValue;
};

export const AccountSelectionErrorType = {
  DatabaseError: "DATABASE_ERROR",
  ValidationError: "VALIDATION_ERROR",
  AccountNotFound: "ACCOUNT_NOT_FOUND",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type AccountSelectionError = {
  type:
    (typeof AccountSelectionErrorType)[keyof typeof AccountSelectionErrorType];
  message: string;
};

export const AccountSelectionDatabaseError: AccountSelectionError = {
  type: AccountSelectionErrorType.DatabaseError,
  message: "Unable to process your request right now. Please try again.",
};

export const AccountSelectionValidationError = (
  message: string,
): AccountSelectionError => ({
  type: AccountSelectionErrorType.ValidationError,
  message,
});

export const AccountNotFoundError: AccountSelectionError = {
  type: AccountSelectionErrorType.AccountNotFound,
  message: "The requested account was not found.",
};

export const AccountSelectionUnknownError: AccountSelectionError = {
  type: AccountSelectionErrorType.UnknownError,
  message: "An unexpected error occurred.",
};

export type AccountResult = Result<Account, AccountSelectionError>;
export type AccountsResult = Result<Account[], AccountSelectionError>;
export type AccountOperationResult = Result<boolean, AccountSelectionError>;
