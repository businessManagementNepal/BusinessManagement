import {
  ImportFileFormatValue,
  ImportJobStatusValue,
  ImportModeValue,
  SettingsDataTransferModuleValue,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";

export class ImportJobModel extends Model {
  static table = "import_jobs";

  @field("remote_id") remoteId!: string;
  @field("active_account_remote_id") activeAccountRemoteId!: string;
  @field("active_user_remote_id") activeUserRemoteId!: string;
  @field("module_id") moduleId!: SettingsDataTransferModuleValue;
  @field("file_name") fileName!: string;
  @field("file_format") fileFormat!: ImportFileFormatValue;
  @field("status") status!: ImportJobStatusValue;
  @field("import_mode") importMode!: ImportModeValue;
  @field("total_rows") totalRows!: number;
  @field("valid_rows") validRows!: number;
  @field("invalid_rows") invalidRows!: number;
  @field("duplicate_rows") duplicateRows!: number;
  @field("imported_rows") importedRows!: number;
  @field("skipped_rows") skippedRows!: number;
  @field("failed_rows") failedRows!: number;
  @field("completed_at") completedAt!: number | null;

  @readonly
  @date("created_at")
  createdAt!: Date;

  @readonly
  @date("updated_at")
  updatedAt!: Date;
}
