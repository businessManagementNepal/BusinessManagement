import React from "react";
import { Database } from "@nozbe/watermelondb";
import { AccountTypeValue } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { useProfileScreenViewModel } from "@/feature/profile/screen/viewModel/profileScreen.viewModel.impl";
import { BusinessDetailsScreen } from "@/feature/profile/screen/ui/BusinessDetailsScreen";
import { useProfileScreenDependencies } from "@/feature/profile/screen/factory/useProfileScreenDependencies.factory";

type GetBusinessDetailsScreenFactoryProps = {
  database: Database;
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  onNavigateHome: (accountType: AccountTypeValue) => void;
  onOpenBusinessDetails: () => void;
  onLogout: () => Promise<void>;
  onBack: () => void;
};

export function GetBusinessDetailsScreenFactory({
  database,
  activeUserRemoteId,
  activeAccountRemoteId,
  onNavigateHome,
  onOpenBusinessDetails,
  onLogout,
  onBack,
}: GetBusinessDetailsScreenFactoryProps) {
  const dependencies = useProfileScreenDependencies(database);

  const viewModel = useProfileScreenViewModel({
    dependencies,
    activeUserRemoteId,
    activeAccountRemoteId,
    onNavigateHome,
    onOpenBusinessDetails,
    onLogout,
    onBack,
  });

  return <BusinessDetailsScreen viewModel={viewModel} />;
}
