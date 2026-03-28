export interface AccountSelectionSubmitViewModel {
  isSubmitting: boolean;
  submitError?: string;
  successMessage?: string;
  onConfirmSelection: () => Promise<void>;
}
