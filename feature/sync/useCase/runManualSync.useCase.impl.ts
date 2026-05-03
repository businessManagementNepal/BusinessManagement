import { GetAccountByRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccountByRemoteId.useCase";
import { createAuthenticationRequiredError } from "@/shared/network/networkError";
import { SYNC_BACKEND_AUTH_REQUIRED_MESSAGE } from "@/shared/sync/constants/sync.constants";
import { RunSyncWorkflowUseCase } from "../workflow/syncRun/useCase/runSyncWorkflow.useCase";
import {
  RunManualSyncInput,
  RunManualSyncUseCase,
} from "./runManualSync.useCase";

type CreateRunManualSyncUseCaseParams = {
  ensureDatabaseReady: () => Promise<void>;
  getAccountByRemoteIdUseCase: GetAccountByRemoteIdUseCase;
  getAccessToken: () => Promise<string | null>;
  getDeviceId: () => Promise<string>;
  runSyncWorkflowUseCase: RunSyncWorkflowUseCase;
  schemaVersion: number;
};

const normalizeValue = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const createValidationError = (message: string): Error => new Error(message);

export const createRunManualSyncUseCase = ({
  ensureDatabaseReady,
  getAccountByRemoteIdUseCase,
  getAccessToken,
  getDeviceId,
  runSyncWorkflowUseCase,
  schemaVersion,
}: CreateRunManualSyncUseCaseParams): RunManualSyncUseCase => ({
  async execute(input: RunManualSyncInput) {
    try {
      await ensureDatabaseReady();

      const activeUserRemoteId = normalizeValue(input.activeUserRemoteId);
      if (!activeUserRemoteId) {
        return {
          success: false,
          error: createValidationError("Sync requires an active user session."),
        };
      }

      const activeAccountRemoteId = normalizeValue(input.activeAccountRemoteId);
      if (!activeAccountRemoteId) {
        return {
          success: false,
          error: createValidationError("Sync requires an active account."),
        };
      }

      const accountResult =
        await getAccountByRemoteIdUseCase.execute(activeAccountRemoteId);
      if (!accountResult.success) {
        return {
          success: false,
          error: createValidationError(accountResult.error.message),
        };
      }

      if (!accountResult.value) {
        return {
          success: false,
          error: createValidationError("Sync requires an active account."),
        };
      }

      const accessToken = normalizeValue(await getAccessToken());
      if (!accessToken) {
        return {
          success: false,
          error: createAuthenticationRequiredError(
            SYNC_BACKEND_AUTH_REQUIRED_MESSAGE,
          ),
        };
      }

      const deviceId = await getDeviceId();
      return runSyncWorkflowUseCase.execute({
        deviceId,
        ownerUserRemoteId: accountResult.value.ownerUserRemoteId,
        accountRemoteId: accountResult.value.remoteId,
        schemaVersion,
        activeUserRemoteId,
        activeAccountRemoteId,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown sync error."),
      };
    }
  },
});
