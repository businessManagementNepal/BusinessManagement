import { BusinessProfile } from "@/feature/profile/business/types/businessProfile.types";
import {
  EditableBusinessProfile,
  EditablePersonalProfile,
  ProfileAccountOption,
  ProfileScreenData,
} from "@/feature/profile/screen/types/profileScreen.types";
import { DEFAULT_CURRENCY_CODE } from "@/shared/utils/currency/accountCurrency";

export const createEmptyPersonalProfile = (): EditablePersonalProfile => ({
  fullName: "",
  phone: "",
  email: "",
  profileImageUrl: "",
});

export const createDefaultBusinessProfileForm = (): EditableBusinessProfile => ({
  legalBusinessName: "",
  businessType: "Retail Store",
  businessLogoUrl: "",
  businessPhone: "",
  businessEmail: "",
  registeredAddress: "",
  currencyCode: DEFAULT_CURRENCY_CODE,
  country: "Nepal",
  city: "",
  stateOrDistrict: "",
  taxRegistrationId: "",
});

export const mapBusinessProfileToForm = (
  businessProfile: BusinessProfile,
): EditableBusinessProfile => ({
  legalBusinessName: businessProfile.legalBusinessName,
  businessType: businessProfile.businessType,
  businessLogoUrl: businessProfile.businessLogoUrl ?? "",
  businessPhone: businessProfile.businessPhone,
  businessEmail: businessProfile.businessEmail,
  registeredAddress: businessProfile.registeredAddress,
  currencyCode: businessProfile.currencyCode,
  country: businessProfile.country,
  city: businessProfile.city,
  stateOrDistrict: businessProfile.stateOrDistrict,
  taxRegistrationId: businessProfile.taxRegistrationId,
});

export const mapAccountOptionToFallbackBusinessForm = (
  accountOption: ProfileAccountOption,
): EditableBusinessProfile => ({
  ...createDefaultBusinessProfileForm(),
  legalBusinessName: accountOption.displayName,
  businessType:
    accountOption.businessType && accountOption.businessType !== "Other"
      ? accountOption.businessType
      : "Retail Store",
  country: accountOption.countryCode ?? "Nepal",
  currencyCode: accountOption.currencyCode ?? DEFAULT_CURRENCY_CODE,
  city: accountOption.cityOrLocation ?? "",
});

export const createInitialProfileScreenData = (): ProfileScreenData => ({
  profileName: "eLekha User",
  loadedAuthUser: null,
  accountOptions: [],
  activeAccountRemoteId: null,
  activeAccountType: null,
  isActiveAccountOwner: false,
  activeAccountDisplayName: "",
  activeBusinessEstablishedYear: "",
  activeAccountRoleLabel: "",
  grantedPermissionCodes: [],
  personalProfile: createEmptyPersonalProfile(),
  activeBusinessProfile: createDefaultBusinessProfileForm(),
  hasActiveBusinessProfile: false,
});
