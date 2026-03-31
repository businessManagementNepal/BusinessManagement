import { Account } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import { BusinessTypeValue } from "@/shared/constants/businessType.constants";
import {
  BusinessProfile,
  BusinessProfileError,
  BusinessProfileValidationError,
} from "@/feature/profile/business/types/businessProfile.types";

export type CreateBusinessWorkspaceInput = {
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
};

export type CreatedBusinessWorkspace = {
  account: Account;
  businessProfile: BusinessProfile;
};

export type CreatedBusinessWorkspaceResult =
  | { success: true; value: CreatedBusinessWorkspace }
  | {
      success: false;
      error: ReturnType<typeof BusinessProfileValidationError> | BusinessProfileError;
    };

export interface CreateBusinessWorkspaceUseCase {
  execute(payload: CreateBusinessWorkspaceInput): Promise<CreatedBusinessWorkspaceResult>;
}
