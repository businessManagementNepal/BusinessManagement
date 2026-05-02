import {
  ContactBalanceDirectionValue,
  ContactTypeValue,
} from "@/feature/contacts/types/contact.types";
import { AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class ContactModel extends Model {
  static table = "contacts";

  @field("remote_id") remoteId!: string;
  @field("owner_user_remote_id") ownerUserRemoteId!: string;
  @field("account_remote_id") accountRemoteId!: string;
  @field("account_type") accountType!: AccountTypeValue;
  @field("contact_type") contactType!: ContactTypeValue;
  @field("full_name") fullName!: string;
  @field("phone_number") phoneNumber!: string | null;
  @field("normalized_phone_number") normalizedPhoneNumber!: string | null;
  @field("email_address") emailAddress!: string | null;
  @field("address") address!: string | null;
  @field("tax_id") taxId!: string | null;
  @field("opening_balance_amount") openingBalanceAmount!: number;
  @field("opening_balance_direction")
  openingBalanceDirection!: ContactBalanceDirectionValue | null;
  @field("notes") notes!: string | null;
  @field("is_archived") isArchived!: boolean;
  @field("server_revision") serverRevision!: string | null;
  @field("sync_status") recordSyncStatus!: string;
  @field("last_synced_at") lastSyncedAt!: number | null;
  @field("deleted_at") deletedAt!: number | null;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
