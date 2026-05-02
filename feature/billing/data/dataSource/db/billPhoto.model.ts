import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class BillPhotoModel extends Model {
  static table = "bill_photos";

  @field("remote_id") remoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("document_remote_id") documentRemoteId!: string | null;
  @field("file_name") fileName!: string;
  @field("mime_type") mimeType!: string | null;
  @field("image_data_url") imageDataUrl!: string;
  @field("uploaded_at") uploadedAt!: number;
  @field("server_revision") serverRevision!: string | null;
  @field("sync_status") recordSyncStatus!: string;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
