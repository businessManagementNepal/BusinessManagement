import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class AccountMemberModel extends Model {
  static table = "account_members";

  @field("remote_id") remoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("user_remote_id") userRemoteId!: string;
  @field("status") status!: "active" | "inactive" | "invited";
  @field("invited_by_user_remote_id")
  invitedByUserRemoteId!: string | null;
  @field("joined_at") joinedAt!: number | null;
  @field("last_active_at") lastActiveAt!: number | null;
  @field("server_revision") serverRevision!: string | null;

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
