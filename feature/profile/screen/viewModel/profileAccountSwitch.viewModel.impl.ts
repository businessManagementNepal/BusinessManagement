import { useCallback, useState } from "react";
import { setActiveAccountSession } from "@/feature/appSettings/data/appSettings.store";
import {
  ProfileAccountSwitchViewModel,
  UseProfileAccountSwitchViewModelParams,
} from "./profileAccountSwitch.viewModel";

export const useProfileAccountSwitchViewModel = (
  params: UseProfileAccountSwitchViewModelParams,
): ProfileAccountSwitchViewModel => {
  const {
    database,
    data,
    onUpdateData,
    onNavigateHome,
    setLoadError,
    clearSuccessMessage,
  } = params;

  const [isSwitchExpanded, setIsSwitchExpanded] = useState(false);

  const onToggleSwitchExpanded = useCallback(() => {
    setIsSwitchExpanded((previousValue) => !previousValue);
    setLoadError(undefined);
    clearSuccessMessage();
  }, [clearSuccessMessage, setLoadError]);

  const onSelectAccount = useCallback(
    async (accountRemoteId: string): Promise<void> => {
      setLoadError(undefined);
      clearSuccessMessage();

      const selectedAccount = data.accountOptions.find(
        (account) => account.remoteId === accountRemoteId,
      );

      if (!selectedAccount) {
        setLoadError("Selected account is no longer available.");
        return;
      }

      try {
        await setActiveAccountSession(database, selectedAccount.remoteId);
        onUpdateData((previousData) => ({
          ...previousData,
          activeAccountRemoteId: selectedAccount.remoteId,
          activeAccountType: selectedAccount.accountType,
          activeAccountDisplayName: selectedAccount.displayName,
        }));
        setIsSwitchExpanded(false);

        onNavigateHome(selectedAccount.accountType);
      } catch (error) {
        console.error("Failed to switch active account from profile.", error);
        setLoadError("Unable to switch account right now. Please try again.");
      }
    },
    [
      clearSuccessMessage,
      data.accountOptions,
      database,
      onNavigateHome,
      onUpdateData,
      setLoadError,
    ],
  );

  return {
    isSwitchExpanded,
    onToggleSwitchExpanded,
    onSelectAccount,
  };
};
