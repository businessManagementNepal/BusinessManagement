import { useCallback, useMemo } from "react";
import {
  AccountSelectionState,
  AccountSelectionStateActions,
} from "./accountSelection.state";
import { AccountSelectionSelectViewModel } from "./accountSelection.select.viewModel";

type UseAccountSelectionSelectViewModelParams = {
  state: AccountSelectionState;
  actions: AccountSelectionStateActions;
};

export const useAccountSelectionSelectViewModel = (
  params: UseAccountSelectionSelectViewModelParams,
): AccountSelectionSelectViewModel => {
  const { state, actions } = params;

  const onSelectAccount = useCallback(
    (accountRemoteId: string): void => {
      if (!state.accounts.some((account) => account.remoteId === accountRemoteId)) {
        return;
      }

      actions.setSelectedAccountRemoteId(accountRemoteId);
      actions.clearFeedback();
    },
    [actions, state.accounts],
  );

  return useMemo<AccountSelectionSelectViewModel>(
    () => ({
      selectedAccountRemoteId: state.selectedAccountRemoteId,
      onSelectAccount,
    }),
    [onSelectAccount, state.selectedAccountRemoteId],
  );
};
