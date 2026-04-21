import { Result } from "../../../shared/types/result.types";

export const MoneyAccountType = {
  Cash: "cash",
  Bank: "bank",
  Wallet: "wallet",
} as const;

export type MoneyAccountTypeValue =
  (typeof MoneyAccountType)[keyof typeof MoneyAccountType];

export const MONEY_ACCOUNT_TYPE_OPTIONS: readonly {
  label: string;
  value: MoneyAccountTypeValue;
}[] = [
  { label: "Cash", value: MoneyAccountType.Cash },
  { label: "Bank", value: MoneyAccountType.Bank },
  { label: "Wallet", value: MoneyAccountType.Wallet },
] as const;

export const MoneyAccountSyncStatus = {
  PendingCreate: "pending_create",
  PendingUpdate: "pending_update",
  PendingDelete: "pending_delete",
  Synced: "synced",
  Failed: "failed",
} as const;

export type MoneyAccountSyncStatusValue =
  (typeof MoneyAccountSyncStatus)[keyof typeof MoneyAccountSyncStatus];

export type MoneyAccount = {
  remoteId: string;
  ownerUserRemoteId: string;
  scopeAccountRemoteId: string;
  name: string;
  type: MoneyAccountTypeValue;
  currentBalance: number;
  description: string | null;
  currencyCode: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

export type SaveMoneyAccountPayload = {
  remoteId: string;
  ownerUserRemoteId: string;
  scopeAccountRemoteId: string;
  scopeAccountDisplayNameSnapshot?: string | null;
  name: string;
  type: MoneyAccountTypeValue;
  currentBalance: number;
  description: string | null;
  currencyCode: string | null;
  isPrimary: boolean;
  isActive: boolean;
};

export type AdjustMoneyAccountBalancePayload = {
  ownerUserRemoteId: string;
  scopeAccountRemoteId: string;
  scopeAccountDisplayNameSnapshot: string;
  moneyAccountRemoteId: string;
  targetBalance: number;
  reason: string;
  adjustedAt: number;
};

export const MoneyAccountErrorType = {
  ValidationError: "VALIDATION_ERROR",
  DatabaseError: "DATABASE_ERROR",
  MoneyAccountNotFound: "MONEY_ACCOUNT_NOT_FOUND",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type MoneyAccountError = {
  type:
    (typeof MoneyAccountErrorType)[keyof typeof MoneyAccountErrorType];
  message: string;
};

export const MoneyAccountValidationError = (
  message: string,
): MoneyAccountError => ({
  type: MoneyAccountErrorType.ValidationError,
  message,
});

export const MoneyAccountDatabaseError: MoneyAccountError = {
  type: MoneyAccountErrorType.DatabaseError,
  message: "Unable to process the account right now. Please try again.",
};

export const MoneyAccountNotFoundError: MoneyAccountError = {
  type: MoneyAccountErrorType.MoneyAccountNotFound,
  message: "The requested money account was not found.",
};

export const MoneyAccountUnknownError: MoneyAccountError = {
  type: MoneyAccountErrorType.UnknownError,
  message: "An unexpected money account error occurred.",
};

export type MoneyAccountResult = Result<MoneyAccount, MoneyAccountError>;
export type MoneyAccountsResult = Result<MoneyAccount[], MoneyAccountError>;
export type MoneyAccountOperationResult = Result<boolean, MoneyAccountError>;
