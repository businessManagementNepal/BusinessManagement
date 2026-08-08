import {
  BugSeverityValue,
  SettingsOperationResult,
} from "@/feature/appSettings/settings/types/settings.types";

export type OpenBugReportEmailPayload = {
  title: string;
  description: string;
  severity: BugSeverityValue;
  appVersion: string | null;
  deviceInfo: string | null;
};

export interface OpenBugReportEmailUseCase {
  execute(
    payload: OpenBugReportEmailPayload,
  ): Promise<SettingsOperationResult>;
}
