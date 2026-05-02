import { SyncOperationValue } from "@/shared/sync/types/syncOperation.types";
import { SyncOutboxStatusValue } from "@/feature/sync/types/sync.constant";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class SyncOutboxModel extends Model {
  static table = "sync_outbox";

  @field("remote_id") remoteId!: string;
  @field("table_name") tableName!: string;
  @field("record_remote_id") recordRemoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("operation") operation!: SyncOperationValue;
  @field("payload_json") payloadJson!: string;
  @field("status") status!: SyncOutboxStatusValue;
  @field("attempt_count") attemptCount!: number;
  @field("last_attempted_at") lastAttemptedAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
