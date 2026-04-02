import { AccountTypeValue } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import {
  EditableBusinessProfile,
  EditablePersonalProfile,
  ProfileAccountOption,
} from "@/feature/profile/screen/types/profileScreen.types";
import { GetAccessibleAccountsByUserRemoteIdUseCase } from "@/feature/setting/accounts/accountSelection/useCase/getAccessibleAccountsByUserRemoteId.useCase";
import { SaveAccountUseCase } from "@/feature/setting/accounts/accountSelection/useCase/saveAccount.useCase";
import { GetAuthUserByRemoteIdUseCase } from "@/feature/session/useCase/getAuthUserByRemoteId.useCase";
import { SaveAuthUserUseCase } from "@/feature/session/useCase/saveAuthUser.useCase";
import { GetBusinessProfileByAccountRemoteIdUseCase } from "@/feature/profile/business/useCase/getBusinessProfileByAccountRemoteId.useCase";
import { SaveBusinessProfileUseCase } from "@/feature/profile/business/useCase/saveBusinessProfile.useCase";
import { CreateBusinessWorkspaceUseCase } from "@/feature/profile/business/useCase/createBusinessWorkspace.useCase";
import { GetUserManagementSnapshotUseCase } from "@/feature/setting/accounts/userManagement/useCase/getUserManagementSnapshot.useCase";
import {
  BUSINESS_TYPE_OPTIONS,
  BusinessTypeValue,
} from "@/shared/constants/businessType.constants";

export type PersonalProfileFieldKey = keyof EditablePersonalProfile;
export type BusinessProfileFieldKey = keyof EditableBusinessProfile;

export interface ProfileScreenViewModel {
  isLoading: boolean;
  loadError?: string;
  successMessage?: string;
  profileName: string;
  roleLabel: string;
  initials: string;
  activeAccountDisplayName: string;
  activeAccountTypeLabel: string;
  activeAccountRemoteId: string | null;
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
  onOpenBusinessDetails: () => void;
  onLogout: () => Promise<void>;
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
  onOpenBusinessDetails: () => void;
  onLogout: () => Promise<void>;
  onBack: () => void;
};

export const PROFILE_BUSINESS_TYPE_OPTIONS = BUSINESS_TYPE_OPTIONS;
