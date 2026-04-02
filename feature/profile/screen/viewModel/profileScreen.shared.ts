import { BusinessProfile } from "@/feature/profile/business/types/businessProfile.types";
import {
  EditableBusinessProfile,
  EditablePersonalProfile,
  ProfileAccountOption,
  ProfileScreenData,
} from "@/feature/profile/screen/types/profileScreen.types";

export const createEmptyPersonalProfile = (): EditablePersonalProfile => ({
  fullName: "",
  phone: "",
  email: "",
});

export const createDefaultBusinessProfileForm = (): EditableBusinessProfile => ({
  legalBusinessName: "",
  businessType: "Other",
  businessLogoUrl: "",
  businessPhone: "",
  businessEmail: "",
  registeredAddress: "",
  currencyCode: "NPR",
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
  businessType: accountOption.businessType ?? "Other",
  country: accountOption.countryCode ?? "Nepal",
  currencyCode: accountOption.currencyCode ?? "NPR",
  city: accountOption.cityOrLocation ?? "",
});

export const createInitialProfileScreenData = (): ProfileScreenData => ({
  profileName: "eLekha User",
  loadedAuthUser: null,
  accountOptions: [],
  activeAccountRemoteId: null,
  activeAccountType: null,
  activeAccountDisplayName: "",
  activeAccountRoleLabel: "",
  grantedPermissionCodes: [],
  personalProfile: createEmptyPersonalProfile(),
  activeBusinessProfile: createDefaultBusinessProfileForm(),
  hasActiveBusinessProfile: false,
});
