import { ImportJobRowStatusValue } from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class ImportJobRowModel extends Model {
  static table = "import_job_rows";

  @field("remote_id") remoteId!: string;
  @field("import_job_remote_id") importJobRemoteId!: string;
  @field("row_number") rowNumber!: number;
  @field("status") status!: ImportJobRowStatusValue;
  @field("raw_json") rawJson!: string;
  @field("normalized_json") normalizedJson!: string | null;
  @field("error_json") errorJson!: string | null;
  @field("warning_json") warningJson!: string | null;
  @field("created_record_remote_id") createdRecordRemoteId!: string | null;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
