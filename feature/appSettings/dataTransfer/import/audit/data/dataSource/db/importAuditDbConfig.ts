import { ImportJobModel } from "./importJob.model";
import { ImportJobRowModel } from "./importJobRow.model";
import { importJobRowsTable } from "./importJobRow.schema";
import { importJobsTable } from "./importJob.schema";

export const importAuditDbConfig = {
  models: [ImportJobModel, ImportJobRowModel],
  tables: [importJobsTable, importJobRowsTable],
};
