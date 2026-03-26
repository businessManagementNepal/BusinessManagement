import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class AuthCredentialModel extends Model {
  static table = "auth_credentials";

  @field("remote_id") remoteId!: string;
  @field("user_remote_id") userRemoteId!: string;
  @field("login_id") loginId!: string;
  @field("credential_type") credentialType!: "password" | "pin";
  @field("password_hash") passwordHash!: string;
  @field("password_salt") passwordSalt!: string;
  @field("hint") hint!: string | null;
  @field("last_login_at") lastLoginAt!: number | null;
  @field("is_active") isActive!: boolean;
  @field("failed_attempt_count") failedAttemptCount!: number | null;
  @field("lockout_until") lockoutUntil!: number | null;
  @field("last_failed_login_at") lastFailedLoginAt!: number | null;

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
