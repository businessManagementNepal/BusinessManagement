import { SyncIdentityBindingTypeValue } from "@/feature/sync/types/syncIdentity.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class SyncIdentityBindingModel extends Model {
  static table = "sync_identity_bindings";

  @field("binding_type") bindingType!: SyncIdentityBindingTypeValue;
  @field("local_user_remote_id") localUserRemoteId!: string;
  @field("remote_user_remote_id") remoteUserRemoteId!: string;
  @field("local_account_remote_id") localAccountRemoteId!: string | null;
  @field("remote_account_remote_id") remoteAccountRemoteId!: string | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
