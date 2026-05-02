import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class AccountRolePermissionModel extends Model {
  static table = "account_role_permissions";

  @field("role_remote_id") roleRemoteId!: string;
  @field("permission_code") permissionCode!: string;
  @field("server_revision") serverRevision!: string | null;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
