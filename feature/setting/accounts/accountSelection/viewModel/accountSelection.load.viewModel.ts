export interface AccountSelectionLoadViewModel {
  isLoading: boolean;
  load: () => Promise<void>;
}
