import { Result } from "@/shared/types/result.types";
import { SaveBusinessProfilePayload } from "@/feature/profile/business/types/businessProfile.types";
import { BusinessProfileModel } from "./db/businessProfile.model";

export interface BusinessProfileDatasource {
  saveBusinessProfile(
    payload: SaveBusinessProfilePayload,
  ): Promise<Result<BusinessProfileModel>>;
  getBusinessProfileByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<BusinessProfileModel>>;
  getBusinessProfilesByOwnerUserRemoteId(
    ownerUserRemoteId: string,
  ): Promise<Result<BusinessProfileModel[]>>;
}
