import { SyncConflictPolicyValue, SyncConflictStatusValue } from "@/shared/sync/types/syncConflict.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class SyncConflictModel extends Model {
  static table = "sync_conflicts";

  @field("remote_id") remoteId!: string;
  @field("table_name") tableName!: string;
  @field("record_remote_id") recordRemoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("local_payload_json") localPayloadJson!: string;
  @field("remote_payload_json") remotePayloadJson!: string;
  @field("conflict_policy") conflictPolicy!: SyncConflictPolicyValue;
  @field("status") status!: SyncConflictStatusValue;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
