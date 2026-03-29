import { Database } from "@nozbe/watermelondb";
import { useEffect, useMemo } from "react";
import { GetAccountsByOwnerUserRemoteIdUseCase } from "../useCase/getAccountsByOwnerUserRemoteId.useCase";
import { SaveAccountUseCase } from "../useCase/saveAccount.useCase";
import { useAccountSelectionLoadViewModel } from "./accountSelection.load.viewModel.impl";
import { useAccountSelectionModeViewModel } from "./accountSelection.mode.viewModel.impl";
import { useAccountSelectionSelectViewModel } from "./accountSelection.select.viewModel.impl";
import { useAccountSelectionState } from "./accountSelection.state";
import { useAccountSelectionSubmitViewModel } from "./accountSelection.submit.viewModel.impl";
import { AccountSelectionViewModel } from "./accountSelection.viewModel";

export type UseAccountSelectionViewModelParams = {
  database: Database;
  getAccountsByOwnerUserRemoteIdUseCase: GetAccountsByOwnerUserRemoteIdUseCase;
  saveAccountUseCase: SaveAccountUseCase;
  onBackToLogin: () => void;
  onAccountSelected?: (accountRemoteId: string) => Promise<void> | void;
};

export function useAccountSelectionViewModel(
  params: UseAccountSelectionViewModelParams,
): AccountSelectionViewModel {
  const {
    database,
    getAccountsByOwnerUserRemoteIdUseCase,
    saveAccountUseCase,
    onBackToLogin,
    onAccountSelected,
  } = params;

  const { state, actions } = useAccountSelectionState();

  const loadViewModel = useAccountSelectionLoadViewModel({
    database,
    state,
    actions,
    getAccountsByOwnerUserRemoteIdUseCase,
  });

  const selectViewModel = useAccountSelectionSelectViewModel({
    state,
    actions,
  });

  const modeViewModel = useAccountSelectionModeViewModel({
    state,
    actions,
  });

  const submitViewModel = useAccountSelectionSubmitViewModel({
    database,
    state,
    actions,
    saveAccountUseCase,
    onAccountSelected,
  });
  const load = loadViewModel.load;

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo<AccountSelectionViewModel>(
    () => ({
      accounts: state.accounts,
      selectedAccountRemoteId: selectViewModel.selectedAccountRemoteId,
      isCreateMode: modeViewModel.isCreateMode,
      canStartCreateMode: modeViewModel.canStartCreateMode,
      canCancelCreateMode: modeViewModel.canCancelCreateMode,
      newAccountType: modeViewModel.newAccountType,
      newAccountDisplayName: modeViewModel.newAccountDisplayName,
      isLoading: loadViewModel.isLoading,
      load: loadViewModel.load,
      isSubmitting: submitViewModel.isSubmitting,
      submitError: submitViewModel.submitError,
      successMessage: submitViewModel.successMessage,
      onSelectAccount: selectViewModel.onSelectAccount,
      onStartCreateMode: modeViewModel.onStartCreateMode,
      onCancelCreateMode: modeViewModel.onCancelCreateMode,
      onChangeNewAccountType: modeViewModel.onChangeNewAccountType,
      onChangeNewAccountDisplayName: modeViewModel.onChangeNewAccountDisplayName,
      onConfirmSelection: submitViewModel.onConfirmSelection,
      onBackToLogin,
    }),
    [
      state.accounts,
      selectViewModel.selectedAccountRemoteId,
      modeViewModel.isCreateMode,
      modeViewModel.canStartCreateMode,
      modeViewModel.canCancelCreateMode,
      modeViewModel.newAccountType,
      modeViewModel.newAccountDisplayName,
      loadViewModel.isLoading,
      loadViewModel.load,
      submitViewModel.isSubmitting,
      submitViewModel.submitError,
      submitViewModel.successMessage,
      selectViewModel.onSelectAccount,
      modeViewModel.onStartCreateMode,
      modeViewModel.onCancelCreateMode,
      modeViewModel.onChangeNewAccountType,
      modeViewModel.onChangeNewAccountDisplayName,
      submitViewModel.onConfirmSelection,
      onBackToLogin,
    ],
  );
}
