import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class AccountRoleModel extends Model {
  static table = "account_roles";

  @field("remote_id") remoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("name") name!: string;
  @field("is_system") isSystem!: boolean;
  @field("is_default") isDefault!: boolean;
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
