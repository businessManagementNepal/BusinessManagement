import { Database } from "@nozbe/watermelondb";
import { ProfileScreenData } from "@/feature/profile/screen/types/profileScreen.types";
import { AccountTypeValue } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";

export type UseProfileAccountSwitchViewModelParams = {
  database: Database;
  data: ProfileScreenData;
  onUpdateData: (
    updater: (previousData: ProfileScreenData) => ProfileScreenData,
  ) => void;
  onNavigateHome: (accountType: AccountTypeValue) => void;
  setLoadError: (nextError: string | undefined) => void;
  clearSuccessMessage: () => void;
};

export interface ProfileAccountSwitchViewModel {
  isSwitchExpanded: boolean;
  onToggleSwitchExpanded: () => void;
  onSelectAccount: (accountRemoteId: string) => Promise<void>;
}
