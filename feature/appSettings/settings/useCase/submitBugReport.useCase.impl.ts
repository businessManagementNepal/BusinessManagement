import {
  SettingsValidationError,
  SubmitBugReportPayload,
  SubmitBugReportResult,
} from "@/feature/appSettings/settings/types/settings.types";
import { SettingsRepository } from "../data/repository/settings.repository";
import { SubmitBugReportUseCase } from "./submitBugReport.useCase";

export const createSubmitBugReportUseCase = (
  settingsRepository: SettingsRepository,
): SubmitBugReportUseCase => ({
  async execute(payload: SubmitBugReportPayload): Promise<SubmitBugReportResult> {
    const normalizedTitle = payload.title.trim();
    const normalizedDescription = payload.description.trim();
    const normalizedUserRemoteId = payload.userRemoteId.trim();

    if (!normalizedUserRemoteId) {
      return {
        success: false,
        error: SettingsValidationError("An active user is required to report a bug."),
      };
    }

    if (!normalizedTitle) {
      return {
        success: false,
        error: SettingsValidationError("Bug title is required."),
      };
    }

    if (!normalizedDescription) {
      return {
        success: false,
        error: SettingsValidationError("Describe the issue before submitting."),
      };
    }

    return settingsRepository.submitBugReport({
      ...payload,
      userRemoteId: normalizedUserRemoteId,
      title: normalizedTitle,
      description: normalizedDescription,
    });
  },
});
