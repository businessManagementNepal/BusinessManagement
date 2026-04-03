import {
  CategoryKindValue,
  CategoryScopeValue,
} from "@/feature/categories/types/category.types";
import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class CategoryModel extends Model {
  static table = "categories";

  @field("remote_id") remoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("account_type") accountType!: AccountTypeValue;
  @field("scope") scope!: CategoryScopeValue;
  @field("kind") kind!: CategoryKindValue;
  @field("name") name!: string;
  @field("description") description!: string | null;
  @field("is_system") isSystem!: boolean;
  @field("sync_status") recordSyncStatus!: string;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
