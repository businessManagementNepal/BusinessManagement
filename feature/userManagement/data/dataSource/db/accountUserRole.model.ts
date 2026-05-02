import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class AccountUserRoleModel extends Model {
  static table = "account_user_roles";

  @field("account_remote_id") accountRemoteId!: string;
  @field("user_remote_id") userRemoteId!: string;
  @field("role_remote_id") roleRemoteId!: string;
  @field("server_revision") serverRevision!: string | null;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
