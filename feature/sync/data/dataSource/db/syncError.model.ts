import { SyncOperationValue } from "@/shared/sync/types/syncOperation.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class SyncErrorModel extends Model {
  static table = "sync_errors";

  @field("remote_id") remoteId!: string;
  @field("sync_run_remote_id") syncRunRemoteId!: string;
  @field("table_name") tableName!: string;
  @field("record_remote_id") recordRemoteId!: string;
  @field("operation") operation!: SyncOperationValue;
  @field("error_type") errorType!: string;
  @field("error_message") errorMessage!: string;
  @field("retry_count") retryCount!: number;
  @field("next_retry_at") nextRetryAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
