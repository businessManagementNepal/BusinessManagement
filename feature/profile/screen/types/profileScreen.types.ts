import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { AuthUser } from "@/feature/session/types/authSession.types";
import { BusinessTypeValue } from "@/shared/constants/businessType.constants";

export type ProfileAccountOption = {
  remoteId: string;
  ownerUserRemoteId: string;
  createdAt: number;
  displayName: string;
  accountType: AccountTypeValue;
  businessType: BusinessTypeValue | null;
  cityOrLocation: string | null;
  countryCode: string | null;
  currencyCode: string | null;
  isDefault: boolean;
};

export type EditablePersonalProfile = {
  fullName: string;
  phone: string;
  email: string;
  profileImageUrl: string;
};

export type EditableBusinessProfile = {
  legalBusinessName: string;
  businessType: BusinessTypeValue;
  businessLogoUrl: string;
  businessPhone: string;
  businessEmail: string;
  registeredAddress: string;
  currencyCode: string;
  country: string;
  city: string;
  stateOrDistrict: string;
  taxRegistrationId: string;
};

export type ProfileScreenData = {
  profileName: string;
  loadedAuthUser: AuthUser | null;
  accountOptions: ProfileAccountOption[];
  activeAccountRemoteId: string | null;
  activeAccountType: AccountTypeValue | null;
  isActiveAccountOwner: boolean;
  activeAccountDisplayName: string;
  activeBusinessEstablishedYear: string;
  activeAccountRoleLabel: string;
  grantedPermissionCodes: string[];
  personalProfile: EditablePersonalProfile;
  activeBusinessProfile: EditableBusinessProfile;
  hasActiveBusinessProfile: boolean;
};
