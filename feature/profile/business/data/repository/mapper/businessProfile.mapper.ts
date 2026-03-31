import { BusinessProfile } from "@/feature/profile/business/types/businessProfile.types";
import { BusinessProfileModel } from "../../dataSource/db/businessProfile.model";

export const mapBusinessProfileModelToDomain = (
  model: BusinessProfileModel,
): BusinessProfile => {
  return {
    accountRemoteId: model.accountRemoteId,
    ownerUserRemoteId: model.ownerUserRemoteId,
    businessType: model.businessType,
    legalBusinessName: model.businessName,
    businessLogoUrl: model.businessLogoUrl,
    businessPhone: model.businessPhone ?? "",
    businessEmail: model.businessEmail ?? "",
    registeredAddress: model.registeredAddress ?? "",
    country: model.country ?? model.countryCode,
    city: model.city ?? "",
    stateOrDistrict: model.stateOrDistrict ?? "",
    taxRegistrationId: model.taxRegistrationId ?? "",
    currencyCode: model.currencyCode,
    isActive: model.isActive,
    createdAt: model.createdAt.getTime(),
    updatedAt: model.updatedAt.getTime(),
  };
};
