import {
  BusinessProfileResult,
  SaveBusinessProfilePayload,
} from "@/feature/profile/business/types/businessProfile.types";

export interface SaveBusinessProfileUseCase {
  execute(payload: SaveBusinessProfilePayload): Promise<BusinessProfileResult>;
}
