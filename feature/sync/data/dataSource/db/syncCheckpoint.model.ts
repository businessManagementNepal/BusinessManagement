import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class SyncCheckpointModel extends Model {
  static table = "sync_checkpoints";

  @field("remote_id") remoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("table_name") tableName!: string;
  @field("server_cursor") serverCursor!: string | null;
  @field("last_pulled_at") lastPulledAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
