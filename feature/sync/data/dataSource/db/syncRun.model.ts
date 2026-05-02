import { SyncRunStatusValue } from "@/feature/sync/types/sync.constant";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class SyncRunModel extends Model {
  static table = "sync_runs";

  @field("remote_id") remoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("status") status!: SyncRunStatusValue;
  @field("started_at") startedAt!: number;
  @field("finished_at") finishedAt!: number | null;
  @field("pushed_count") pushedCount!: number;
  @field("pulled_count") pulledCount!: number;
  @field("conflict_count") conflictCount!: number;
  @field("failed_count") failedCount!: number;
  @field("error_message") errorMessage!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
