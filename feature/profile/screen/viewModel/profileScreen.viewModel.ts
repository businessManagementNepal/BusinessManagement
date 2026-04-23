import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { GetAccessibleAccountsByUserRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccessibleAccountsByUserRemoteId.useCase";
import { SaveAccountUseCase } from "@/feature/auth/accountSelection/useCase/saveAccount.useCase";
import { BusinessProfileFieldErrors } from "@/feature/profile/business/types/businessProfile.types";
import { CreateBusinessWorkspaceUseCase } from "@/feature/profile/business/useCase/createBusinessWorkspace.useCase";
import { GetBusinessProfileByAccountRemoteIdUseCase } from "@/feature/profile/business/useCase/getBusinessProfileByAccountRemoteId.useCase";
import { SaveBusinessProfileUseCase } from "@/feature/profile/business/useCase/saveBusinessProfile.useCase";
import {
  EditableBusinessProfile,
  EditablePersonalProfile,
  ProfileAccountOption,
} from "@/feature/profile/screen/types/profileScreen.types";
import { GetAuthUserByRemoteIdUseCase } from "@/feature/session/useCase/getAuthUserByRemoteId.useCase";
import { SaveAuthUserUseCase } from "@/feature/session/useCase/saveAuthUser.useCase";
import { GetUserManagementSnapshotUseCase } from "@/feature/userManagement/useCase/getUserManagementSnapshot.useCase";
import {
  BUSINESS_TYPE_OPTIONS,
  BusinessTypeValue,
} from "@/shared/constants/businessType.constants";

export type PersonalProfileFieldKey = keyof EditablePersonalProfile;
export type BusinessProfileFieldKey = keyof EditableBusinessProfile;

export interface ProfileScreenViewModel {
  isLoading: boolean;
  loadError: string | null;
  successMessage: string | null;
  profileName: string;
  roleLabel: string;
  initials: string;
  activeAccountDisplayName: string;
  activeAccountTypeLabel: string;
  activeAccountRemoteId: string | null;
  activeBusinessEstablishedYear: string;
  isActiveBusinessStaff: boolean;
  accountOptions: readonly ProfileAccountOption[];
  isSwitchExpanded: boolean;
  onToggleSwitchExpanded: () => void;
  onSelectAccount: (accountRemoteId: string) => Promise<void>;

  personalProfileForm: EditablePersonalProfile;
  isPersonalEditing: boolean;
  isSavingPersonalProfile: boolean;
  onStartPersonalEdit: () => void;
  onCancelPersonalEdit: () => void;
  onUpdatePersonalProfileField: (
    field: PersonalProfileFieldKey,
    value: string,
  ) => void;
  onSavePersonalProfile: () => Promise<void>;

  activeBusinessProfileForm: EditableBusinessProfile;
  hasActiveBusinessProfile: boolean;
  canEditBusinessProfile: boolean;
  isBusinessEditing: boolean;
  isSavingBusinessProfile: boolean;
  onStartBusinessEdit: () => void;
  onCancelBusinessEdit: () => void;
  onUpdateBusinessProfileField: (
    field: BusinessProfileFieldKey,
    value: string,
  ) => void;
  onSaveBusinessProfile: () => Promise<void>;

  createBusinessProfileForm: EditableBusinessProfile;
  createBusinessProfileFieldErrors: BusinessProfileFieldErrors;
  isCreateBusinessExpanded: boolean;
  isCreatingBusinessProfile: boolean;
  onToggleCreateBusinessExpanded: () => void;
  onUpdateCreateBusinessProfileField: (
    field: BusinessProfileFieldKey,
    value: string,
  ) => void;
  onCreateBusinessProfile: () => Promise<void>;

  businessTypeOptions: readonly {
    value: BusinessTypeValue;
    label: string;
  }[];
  onBack: () => void;
}

export type ProfileScreenDependencies = {
  getAccessibleAccountsByUserRemoteIdUseCase: GetAccessibleAccountsByUserRemoteIdUseCase;
  saveAccountUseCase: SaveAccountUseCase;
  getAuthUserByRemoteIdUseCase: GetAuthUserByRemoteIdUseCase;
  saveAuthUserUseCase: SaveAuthUserUseCase;
  getBusinessProfileByAccountRemoteIdUseCase: GetBusinessProfileByAccountRemoteIdUseCase;
  saveBusinessProfileUseCase: SaveBusinessProfileUseCase;
  createBusinessWorkspaceUseCase: CreateBusinessWorkspaceUseCase;
  getUserManagementSnapshotUseCase: GetUserManagementSnapshotUseCase;
  setActiveAccountSession: (accountRemoteId: string) => Promise<void>;
};

export type UseProfileScreenViewModelParams = {
  dependencies: ProfileScreenDependencies;
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  onNavigateHome: (accountType: AccountTypeValue) => void;
  onBack: () => void;
};

export const PROFILE_BUSINESS_TYPE_OPTIONS = BUSINESS_TYPE_OPTIONS.filter(
  (option) => option.value !== "Other",
);
