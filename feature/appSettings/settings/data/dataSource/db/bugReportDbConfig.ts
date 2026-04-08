import { BugReportModel } from "./bugReport.model";
import { bugReportsTable } from "./bugReport.schema";

export const bugReportDbConfig = {
  models: [BugReportModel],
  tables: [bugReportsTable],
};
