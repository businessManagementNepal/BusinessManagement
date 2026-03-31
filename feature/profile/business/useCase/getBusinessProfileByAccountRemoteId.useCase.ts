import { BusinessProfileResult } from "@/feature/profile/business/types/businessProfile.types";

export interface GetBusinessProfileByAccountRemoteIdUseCase {
  execute(accountRemoteId: string): Promise<BusinessProfileResult>;
}
