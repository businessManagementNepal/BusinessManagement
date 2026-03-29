import { Database } from "@nozbe/watermelondb";
import { useCallback, useMemo } from "react";
import { getAppSessionState } from "@/feature/appSettings/data/appSettings.store";
import { AccountType } from "../types/accountSelection.types";
import { GetAccountsByOwnerUserRemoteIdUseCase } from "../useCase/getAccountsByOwnerUserRemoteId.useCase";
import {
  AccountSelectionState,
  AccountSelectionStateActions,
} from "./accountSelection.state";
import { AccountSelectionLoadViewModel } from "./accountSelection.load.viewModel";

type UseAccountSelectionLoadViewModelParams = {
  database: Database;
  state: AccountSelectionState;
  actions: AccountSelectionStateActions;
  getAccountsByOwnerUserRemoteIdUseCase: GetAccountsByOwnerUserRemoteIdUseCase;
};

export const useAccountSelectionLoadViewModel = (
  params: UseAccountSelectionLoadViewModelParams,
): AccountSelectionLoadViewModel => {
  const {
    database,
    state,
    actions,
    getAccountsByOwnerUserRemoteIdUseCase,
  } = params;

  const load = useCallback(async (): Promise<void> => {
    actions.setIsLoading(true);
    actions.clearFeedback();

    try {
      const sessionState = await getAppSessionState(database);
      const currentActiveUserRemoteId = sessionState.activeUserRemoteId;
      actions.setActiveUserRemoteId(currentActiveUserRemoteId);

      if (!currentActiveUserRemoteId) {
        actions.setAccounts([]);
        actions.setSelectedAccountRemoteId(null);
        actions.setIsCreateMode(false);
        actions.setNewAccountDisplayName("");
        actions.setSubmitError("Active user session not found. Please log in again.");
        return;
      }

      const accountsResult = await getAccountsByOwnerUserRemoteIdUseCase.execute(
        currentActiveUserRemoteId,
      );

      if (!accountsResult.success) {
        actions.setAccounts([]);
        actions.setSelectedAccountRemoteId(null);
        actions.setIsCreateMode(false);
        actions.setNewAccountDisplayName("");
        actions.setSubmitError(accountsResult.error.message);
        return;
      }

      const availableAccounts = accountsResult.value;

      if (availableAccounts.length === 0) {
        actions.setAccounts([]);
        actions.setSelectedAccountRemoteId(null);
        actions.setIsCreateMode(false);
        actions.setNewAccountType(AccountType.Personal);
        actions.setNewAccountDisplayName("");
        return;
      }

      actions.setAccounts(availableAccounts);
      actions.setIsCreateMode(false);
      actions.setNewAccountType(AccountType.Personal);
      actions.setNewAccountDisplayName("");

      const persistedActiveAccountId = sessionState.activeAccountRemoteId;
      const hasPersistedAccount = Boolean(
        persistedActiveAccountId &&
          availableAccounts.some(
            (account) => account.remoteId === persistedActiveAccountId,
          ),
      );

      const defaultAccountRemoteId =
        availableAccounts.find((account) => account.isDefault)?.remoteId ??
        availableAccounts[0].remoteId;

      actions.setSelectedAccountRemoteId(
        hasPersistedAccount ? persistedActiveAccountId! : defaultAccountRemoteId,
      );
    } catch (error) {
      actions.setAccounts([]);
      actions.setSelectedAccountRemoteId(null);
      actions.setIsCreateMode(false);
      actions.setNewAccountDisplayName("");
      actions.setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to load accounts. Please try again.",
      );
    } finally {
      actions.setIsLoading(false);
    }
  }, [
    actions,
    database,
    getAccountsByOwnerUserRemoteIdUseCase,
  ]);

  return useMemo<AccountSelectionLoadViewModel>(
    () => ({
      isLoading: state.isLoading,
      load,
    }),
    [load, state.isLoading],
  );
};
