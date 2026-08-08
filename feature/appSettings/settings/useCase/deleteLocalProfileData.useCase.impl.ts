import { LocalProfileDataFilesStore } from "@/feature/appSettings/settings/data/localProfileDataFiles.store";
import {
  SettingsErrorType,
  SettingsOperationResult,
} from "@/feature/appSettings/settings/types/settings.types";
import { AuthTokenStore } from "@/shared/auth/authTokenStore";
import { DeviceIdStore } from "@/shared/device/deviceIdStore";
import { Database } from "@nozbe/watermelondb";
import { DeleteLocalProfileDataUseCase } from "./deleteLocalProfileData.useCase";

type CreateDeleteLocalProfileDataUseCaseParams = {
  database: Database;
  authTokenStore: Pick<AuthTokenStore, "clearTokens">;
  deviceIdStore: Pick<DeviceIdStore, "clearDeviceId">;
  localProfileDataFilesStore: LocalProfileDataFilesStore;
  clearLedgerReminders: () => Promise<void>;
  clearDatabaseEncryptionKey: () => Promise<void>;
};

export const createDeleteLocalProfileDataUseCase = ({
  database,
  authTokenStore,
  deviceIdStore,
  localProfileDataFilesStore,
  clearLedgerReminders,
  clearDatabaseEncryptionKey,
}: CreateDeleteLocalProfileDataUseCaseParams): DeleteLocalProfileDataUseCase => ({
  async execute(): Promise<SettingsOperationResult> {
    try {
      await clearLedgerReminders();
      await authTokenStore.clearTokens();
      await deviceIdStore.clearDeviceId();
      await clearDatabaseEncryptionKey();
      await localProfileDataFilesStore.clearAppPrivateUserFiles();

      await database.write(async () => {
        await database.unsafeResetDatabase();
      });

      return { success: true, value: true };
    } catch (error) {
      console.error(
        "Local eLekha data deletion failed.",
        error instanceof Error ? error.name : "UnknownError",
      );

      return {
        success: false,
        error: {
          type: SettingsErrorType.DataSourceError,
          message:
            "Unable to delete all local eLekha data. Please try again.",
        },
      };
    }
  },
});
