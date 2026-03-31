import { Database } from "@nozbe/watermelondb";
import {
  AccountTypeValue,
} from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { CreateBusinessWorkspaceUseCase } from "@/feature/profile/business/useCase/createBusinessWorkspace.useCase";
import {
  EditableBusinessProfile,
  ProfileScreenData,
} from "@/feature/profile/screen/types/profileScreen.types";

export type UseProfileBusinessCreatorViewModelParams = {
  database: Database;
  activeUserRemoteId: string | null;
  createBusinessWorkspaceUseCase: CreateBusinessWorkspaceUseCase;
  onNavigateHome: (accountType: AccountTypeValue) => void;
  onUpdateData: (
    updater: (previousData: ProfileScreenData) => ProfileScreenData,
  ) => void;
  setLoadError: (nextError: string | undefined) => void;
  setSuccessMessage: (nextMessage: string | undefined) => void;
};

export interface ProfileBusinessCreatorViewModel {
  createBusinessProfileForm: EditableBusinessProfile;
  isCreateBusinessExpanded: boolean;
  isCreatingBusinessProfile: boolean;
  onToggleCreateBusinessExpanded: () => void;
  onUpdateCreateBusinessProfileField: (
    field: keyof EditableBusinessProfile,
    value: string,
  ) => void;
  onCreateBusinessProfile: () => Promise<void>;
}
