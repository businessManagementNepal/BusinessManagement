import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { BusinessProfileFieldErrors } from "@/feature/profile/business/types/businessProfile.types";
import { CreateBusinessWorkspaceUseCase } from "@/feature/profile/business/useCase/createBusinessWorkspace.useCase";
import {
  EditableBusinessProfile,
  ProfileScreenData,
} from "@/feature/profile/screen/types/profileScreen.types";

export type UseProfileBusinessCreatorViewModelParams = {
  setActiveAccountSession: (accountRemoteId: string) => Promise<void>;
  activeUserRemoteId: string | null;
  createBusinessWorkspaceUseCase: CreateBusinessWorkspaceUseCase;
  onNavigateHome: (accountType: AccountTypeValue) => void;
  onUpdateData: (
    updater: (previousData: ProfileScreenData) => ProfileScreenData,
  ) => void;
  setLoadError: (nextError: string | null) => void;
  setSuccessMessage: (nextMessage: string | null) => void;
};

export interface ProfileBusinessCreatorViewModel {
  createBusinessProfileForm: EditableBusinessProfile;
  createBusinessProfileFieldErrors: BusinessProfileFieldErrors;
  isCreateBusinessExpanded: boolean;
  isCreatingBusinessProfile: boolean;
  onToggleCreateBusinessExpanded: () => void;
  onUpdateCreateBusinessProfileField: (
    field: keyof EditableBusinessProfile,
    value: string,
  ) => void;
  onCreateBusinessProfile: () => Promise<void>;
}
