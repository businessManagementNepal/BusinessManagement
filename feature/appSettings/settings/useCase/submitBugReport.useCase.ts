import {
  SubmitBugReportPayload,
  SubmitBugReportResult,
} from "@/feature/appSettings/settings/types/settings.types";

export interface SubmitBugReportUseCase {
  execute(payload: SubmitBugReportPayload): Promise<SubmitBugReportResult>;
}
