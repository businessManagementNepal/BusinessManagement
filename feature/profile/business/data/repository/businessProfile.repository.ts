import {
  BusinessProfileResult,
  BusinessProfilesResult,
  SaveBusinessProfilePayload,
} from "@/feature/profile/business/types/businessProfile.types";

export interface BusinessProfileRepository {
  saveBusinessProfile(
    payload: SaveBusinessProfilePayload,
  ): Promise<BusinessProfileResult>;
  getBusinessProfileByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<BusinessProfileResult>;
  getBusinessProfilesByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<BusinessProfilesResult>;
}
