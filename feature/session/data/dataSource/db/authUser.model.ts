import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class AuthUserModel extends Model {
  static table = "auth_users";

  @field("remote_id") remoteId!: string;
  @field("full_name") fullName!: string;
  @field("email") email!: string | null;
  @field("phone") phone!: string | null;
  @field("auth_provider") authProvider!: string | null;
  @field("profile_image_url") profileImageUrl!: string | null;
  @field("preferred_language") preferredLanguage!: string | null;
  @field("is_email_verified") isEmailVerified!: boolean;
  @field("is_phone_verified") isPhoneVerified!: boolean;

  @field("sync_status")
  recordSyncStatus!:
    | "pending"
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