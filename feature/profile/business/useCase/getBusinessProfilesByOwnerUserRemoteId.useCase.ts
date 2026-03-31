import { BusinessProfilesResult } from "@/feature/profile/business/types/businessProfile.types";

export interface GetBusinessProfilesByOwnerUserRemoteIdUseCase {
  execute(ownerUserRemoteId: string): Promise<BusinessProfilesResult>;
}
