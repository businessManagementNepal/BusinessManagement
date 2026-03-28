import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";
import { BusinessTypeValue } from "@/shared/constants/businessType.constants";

export class AccountModel extends Model {
  static table = "accounts";

  @field("remote_id") remoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("account_type") accountType!: "personal" | "business";
  @field("business_type") businessType!: BusinessTypeValue | null;
  @field("display_name") displayName!: string;
  @field("currency_code") currencyCode!: string | null;
  @field("city_or_location") cityOrLocation!: string | null;
  @field("country_code") countryCode!: string | null;
  @field("is_active") isActive!: boolean;
  @field("is_default") isDefault!: boolean;

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
