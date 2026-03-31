import React from "react";
import { Database } from "@nozbe/watermelondb";
import { AccountTypeValue } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { useProfileScreenViewModel } from "@/feature/profile/screen/viewModel/profileScreen.viewModel.impl";
import { ProfileScreen } from "@/feature/profile/screen/ui/ProfileScreen";

type GetProfileScreenFactoryProps = {
  database: Database;
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  onNavigateHome: (accountType: AccountTypeValue) => void;
  onLogout: () => Promise<void>;
  onBack: () => void;
};

export function GetProfileScreenFactory({
  database,
  activeUserRemoteId,
  activeAccountRemoteId,
  onNavigateHome,
  onLogout,
  onBack,
}: GetProfileScreenFactoryProps) {
  const viewModel = useProfileScreenViewModel({
    database,
    activeUserRemoteId,
    activeAccountRemoteId,
    onNavigateHome,
    onLogout,
    onBack,
  });

  return <ProfileScreen viewModel={viewModel} />;
}
