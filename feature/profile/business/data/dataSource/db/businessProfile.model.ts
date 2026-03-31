import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";
import { BusinessTypeValue } from "@/shared/constants/businessType.constants";

export class BusinessProfileModel extends Model {
  static table = "business_profiles";

  @field("account_remote_id") accountRemoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("business_type") businessType!: BusinessTypeValue;
  @field("business_name") businessName!: string;
  @field("business_logo_url") businessLogoUrl!: string | null;
  @field("business_phone") businessPhone!: string | null;
  @field("business_email") businessEmail!: string | null;
  @field("registered_address") registeredAddress!: string | null;
  @field("country") country!: string | null;
  @field("city") city!: string | null;
  @field("state_or_district") stateOrDistrict!: string | null;
  @field("tax_registration_id") taxRegistrationId!: string | null;
  @field("country_code") countryCode!: string;
  @field("currency_code") currencyCode!: string;
  @field("timezone") timezone!: string;
  @field("phone_policy") phonePolicy!: string;
  @field("is_active") isActive!: boolean;

  @field("sync_status")
  recordSyncStatus!:
    | "pending_create"
    | "pending_update"
    | "pending_delete"
    | "synced"
    | "failed";
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
