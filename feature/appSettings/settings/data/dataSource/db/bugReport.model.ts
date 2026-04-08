import { BugSeverityValue } from "@/feature/appSettings/settings/types/settings.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class BugReportModel extends Model {
  static table = "bug_reports";

  @field("remote_id") remoteId!: string;
  @field("user_remote_id") userRemoteId!: string;
  @field("title") title!: string;
  @field("description") description!: string;
  @field("severity") severity!: BugSeverityValue;
  @field("device_info") deviceInfo!: string | null;
  @field("app_version") appVersion!: string | null;
  @field("submitted_at") submittedAt!: number;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
