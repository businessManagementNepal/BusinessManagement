import { AccountTypeValue } from "../types/accountSelection.types";

export interface AccountSelectionModeViewModel {
  isCreateMode: boolean;
  canStartCreateMode: boolean;
  canCancelCreateMode: boolean;
  newAccountType: AccountTypeValue;
  newAccountDisplayName: string;
  onStartCreateMode: () => void;
  onCancelCreateMode: () => void;
  onChangeNewAccountType: (accountType: AccountTypeValue) => void;
  onChangeNewAccountDisplayName: (displayName: string) => void;
}
