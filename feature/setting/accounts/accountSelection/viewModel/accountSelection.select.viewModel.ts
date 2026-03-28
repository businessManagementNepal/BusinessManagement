export interface AccountSelectionSelectViewModel {
  selectedAccountRemoteId: string | null;
  onSelectAccount: (accountRemoteId: string) => void;
}
