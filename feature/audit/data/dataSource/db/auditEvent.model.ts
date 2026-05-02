import type {
  AuditModuleValue,
  AuditOutcomeValue,
  AuditSeverityValue,
} from "@/feature/audit/types/audit.entity.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class AuditEventModel extends Model {
  static table = "audit_events";

  @field("remote_id") remoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("actor_user_remote_id") actorUserRemoteId!: string;
  @field("module") module!: AuditModuleValue;
  @field("action") action!: string;
  @field("source_module") sourceModule!: string;
  @field("source_remote_id") sourceRemoteId!: string;
  @field("source_action") sourceAction!: string;
  @field("outcome") outcome!: AuditOutcomeValue;
  @field("severity") severity!: AuditSeverityValue;
  @field("summary") summary!: string;
  @field("metadata_json") metadataJson!: string | null;
  @field("server_revision") serverRevision!: string | null;
  @field("sync_status") recordSyncStatus!: "pending" | "synced" | "failed";
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
