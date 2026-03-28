import { useCallback, useMemo } from "react";
import { AccountType, AccountTypeValue } from "../types/accountSelection.types";
import {
  AccountSelectionState,
  AccountSelectionStateActions,
} from "./accountSelection.state";
import { AccountSelectionModeViewModel } from "./accountSelection.mode.viewModel";

type UseAccountSelectionModeViewModelParams = {
  state: AccountSelectionState;
  actions: AccountSelectionStateActions;
};

export const useAccountSelectionModeViewModel = (
  params: UseAccountSelectionModeViewModelParams,
): AccountSelectionModeViewModel => {
  const { state, actions } = params;

  const onChangeNewAccountType = useCallback(
    (accountType: AccountTypeValue): void => {
      actions.setNewAccountType(accountType);
      actions.clearFeedback();
    },
    [actions],
  );

  const onChangeNewAccountDisplayName = useCallback(
    (displayName: string): void => {
      actions.setNewAccountDisplayName(displayName);
      actions.clearFeedback();
    },
    [actions],
  );

  const onStartCreateMode = useCallback((): void => {
    actions.setIsCreateMode(true);
    actions.setNewAccountType(AccountType.Personal);
    actions.setNewAccountDisplayName("");
    actions.clearFeedback();
  }, [actions]);

  const onCancelCreateMode = useCallback((): void => {
    if (state.accounts.length === 0) {
      return;
    }

    actions.setIsCreateMode(false);
    actions.setNewAccountType(AccountType.Personal);
    actions.setNewAccountDisplayName("");
    actions.clearFeedback();
  }, [actions, state.accounts.length]);

  return useMemo<AccountSelectionModeViewModel>(
    () => ({
      isCreateMode: state.isCreateMode,
      canStartCreateMode: !state.isCreateMode && state.accounts.length > 0,
      canCancelCreateMode: state.isCreateMode && state.accounts.length > 0,
      newAccountType: state.newAccountType,
      newAccountDisplayName: state.newAccountDisplayName,
      onStartCreateMode,
      onCancelCreateMode,
      onChangeNewAccountType,
      onChangeNewAccountDisplayName,
    }),
    [
      onCancelCreateMode,
      onChangeNewAccountDisplayName,
      onChangeNewAccountType,
      onStartCreateMode,
      state.accounts.length,
      state.isCreateMode,
      state.newAccountDisplayName,
      state.newAccountType,
    ],
  );
};
