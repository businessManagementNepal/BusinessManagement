import {
  MoneyAccount,
  MoneyAccountTypeValue,
} from "@/feature/accounts/types/moneyAccount.types";

export type MoneyAccountFormState = {
  remoteId: string | null;
  name: string;
  type: MoneyAccountTypeValue;
  balance: string;
  description: string;
};

export interface MoneyAccountsViewModel {
  isLoading: boolean;
  errorMessage: string | null;
  canManage: boolean;
  currencyCode: string;
  countryCode: string | null;
  currencyLabel: string;
  totalBalanceLabel: string;
  accounts: readonly MoneyAccount[];
  isEditorVisible: boolean;
  editorMode: "create" | "edit";
  form: MoneyAccountFormState;
  onRefresh: () => Promise<void>;
  onOpenCreate: () => void;
  onOpenEdit: (account: MoneyAccount) => void;
  onCloseEditor: () => void;
  onFormChange: (field: keyof MoneyAccountFormState, value: string) => void;
  onSubmit: () => Promise<void>;
}
