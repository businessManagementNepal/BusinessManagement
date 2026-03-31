import { Result } from "@/shared/types/result.types";
import { BusinessTypeValue } from "@/shared/constants/businessType.constants";

export type SaveBusinessProfilePayload = {
  accountRemoteId: string;
  ownerUserRemoteId: string;
  legalBusinessName: string;
  businessType: BusinessTypeValue;
  businessLogoUrl: string | null;
  businessPhone: string;
  businessEmail: string;
  registeredAddress: string;
  currencyCode: string;
  country: string;
  city: string;
  stateOrDistrict: string;
  taxRegistrationId: string;
  isActive: boolean;
};

export type BusinessProfile = {
  accountRemoteId: string;
  ownerUserRemoteId: string;
  legalBusinessName: string;
  businessType: BusinessTypeValue;
  businessLogoUrl: string | null;
  businessPhone: string;
  businessEmail: string;
  registeredAddress: string;
  currencyCode: string;
  country: string;
  city: string;
  stateOrDistrict: string;
  taxRegistrationId: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

export const BusinessProfileErrorType = {
  DatabaseError: "DATABASE_ERROR",
  ValidationError: "VALIDATION_ERROR",
  ProfileNotFound: "PROFILE_NOT_FOUND",
  UnknownError: "UNKNOWN_ERROR",
} as const;

export type BusinessProfileError = {
  type:
    (typeof BusinessProfileErrorType)[keyof typeof BusinessProfileErrorType];
  message: string;
};

export const BusinessProfileDatabaseError: BusinessProfileError = {
  type: BusinessProfileErrorType.DatabaseError,
  message: "Unable to process your request right now. Please try again.",
};

export const BusinessProfileValidationError = (
  message: string,
): BusinessProfileError => ({
  type: BusinessProfileErrorType.ValidationError,
  message,
});

export const BusinessProfileNotFoundError: BusinessProfileError = {
  type: BusinessProfileErrorType.ProfileNotFound,
  message: "Business profile not found for the selected account.",
};

export const BusinessProfileUnknownError: BusinessProfileError = {
  type: BusinessProfileErrorType.UnknownError,
  message: "An unexpected error occurred.",
};

export type BusinessProfileResult = Result<
  BusinessProfile,
  BusinessProfileError
>;

export type BusinessProfilesResult = Result<
  BusinessProfile[],
  BusinessProfileError
>;

export type BusinessProfileOperationResult = Result<
  boolean,
  BusinessProfileError
>;
