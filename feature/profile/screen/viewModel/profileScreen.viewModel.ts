import { Database } from "@nozbe/watermelondb";
import { AccountTypeValue } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import {
  EditableBusinessProfile,
  EditablePersonalProfile,
  ProfileAccountOption,
} from "@/feature/profile/screen/types/profileScreen.types";
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
  onLogout: () => Promise<void>;
  onBack: () => void;
}

export type UseProfileScreenViewModelParams = {
  database: Database;
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  onNavigateHome: (accountType: AccountTypeValue) => void;
  onLogout: () => Promise<void>;
  onBack: () => void;
};

export const PROFILE_BUSINESS_TYPE_OPTIONS = BUSINESS_TYPE_OPTIONS;
