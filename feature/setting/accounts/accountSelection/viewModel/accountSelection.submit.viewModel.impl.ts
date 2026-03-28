import { Database } from "@nozbe/watermelondb";
import { useCallback, useMemo } from "react";
import * as Crypto from "expo-crypto";
import { setActiveAccountSession } from "@/feature/appSettings/data/appSettings.store";
import { sortAccountsByDefaultAndUpdatedAt } from "@/shared/utils/account/accountSorting.util";
import { AccountType } from "../types/accountSelection.types";
import { SaveAccountUseCase } from "../useCase/saveAccount.useCase";
import {
  AccountSelectionState,
  AccountSelectionStateActions,
} from "./accountSelection.state";
import { AccountSelectionSubmitViewModel } from "./accountSelection.submit.viewModel";

type UseAccountSelectionSubmitViewModelParams = {
  database: Database;
  state: AccountSelectionState;
  actions: AccountSelectionStateActions;
  saveAccountUseCase: SaveAccountUseCase;
  onAccountSelected?: (accountRemoteId: string) => Promise<void> | void;
};

export const useAccountSelectionSubmitViewModel = (
  params: UseAccountSelectionSubmitViewModelParams,
): AccountSelectionSubmitViewModel => {
  const { database, state, actions, saveAccountUseCase, onAccountSelected } = params;

  const onConfirmSelection = useCallback(async (): Promise<void> => {
    actions.setIsSubmitting(true);
    actions.clearFeedback();

    try {
      let targetAccountRemoteId = state.selectedAccountRemoteId;

      if (state.isCreateMode) {
        if (!state.activeUserRemoteId) {
          actions.setSubmitError("Active user session not found. Please log in again.");
          return;
        }

        const normalizedDisplayName = state.newAccountDisplayName.trim();

        if (!normalizedDisplayName) {
          actions.setSubmitError("Account name is required.");
          return;
        }

        const saveAccountResult = await saveAccountUseCase.execute({
          remoteId: Crypto.randomUUID(),
          ownerUserRemoteId: state.activeUserRemoteId,
          accountType: state.newAccountType,
          businessType: null,
          displayName: normalizedDisplayName,
          currencyCode: null,
          cityOrLocation: null,
          countryCode: null,
          isActive: true,
          isDefault: state.accounts.length === 0,
        });

        if (!saveAccountResult.success) {
          actions.setSubmitError(saveAccountResult.error.message);
          return;
        }

        const createdAccount = saveAccountResult.value;
        actions.setAccounts((previousAccounts) =>
          sortAccountsByDefaultAndUpdatedAt([...previousAccounts, createdAccount]),
        );
        actions.setSelectedAccountRemoteId(createdAccount.remoteId);
        actions.setIsCreateMode(false);
        actions.setNewAccountType(AccountType.Personal);
        actions.setNewAccountDisplayName("");
        targetAccountRemoteId = createdAccount.remoteId;
      } else if (
        !targetAccountRemoteId ||
        !state.accounts.some((account) => account.remoteId === targetAccountRemoteId)
      ) {
        actions.setSubmitError("Please select an account to continue.");
        return;
      }

      await setActiveAccountSession(database, targetAccountRemoteId);

      if (onAccountSelected) {
        await onAccountSelected(targetAccountRemoteId);
      }

      actions.setSuccessMessage("Account selection saved.");
    } catch (error) {
      actions.setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to save selected account. Please try again.",
      );
    } finally {
      actions.setIsSubmitting(false);
    }
  }, [
    actions,
    database,
    onAccountSelected,
    saveAccountUseCase,
    state.accounts,
    state.activeUserRemoteId,
    state.isCreateMode,
    state.newAccountDisplayName,
    state.newAccountType,
    state.selectedAccountRemoteId,
  ]);

  return useMemo<AccountSelectionSubmitViewModel>(
    () => ({
      isSubmitting: state.isSubmitting,
      submitError: state.submitError,
      successMessage: state.successMessage,
      onConfirmSelection,
    }),
    [onConfirmSelection, state.isSubmitting, state.submitError, state.successMessage],
  );
};
