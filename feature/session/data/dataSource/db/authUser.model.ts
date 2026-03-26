import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

export class AuthUserModel extends Model {
  static table = "auth_users";

  @text("remote_id")
  remoteId!: string;

  @text("full_name")
  fullName!: string;

  @text("email")
  email!: string | null;

  @text("phone")
  phone!: string | null;

  @text("auth_provider")
  authProvider!: string | null;

  @text("profile_image_url")
  profileImageUrl!: string | null;

  @text("preferred_language")
  preferredLanguage!: string | null;

  @field("is_email_verified")
  isEmailVerified!: boolean;

  @field("is_phone_verified")
  isPhoneVerified!: boolean;

  @text("sync_status")
  localSyncStatus!: string;

  @field("last_synced_at")
  lastSyncedAt!: number | null;

  @field("deleted_at")
  deletedAt!: number | null;

  @field("created_at")
  createdAt!: number;

  @field("updated_at")
  updatedAt!: number;
}
