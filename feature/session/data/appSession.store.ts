import { Database } from "@nozbe/watermelondb";
import { AppSettingsModel } from "./dataSource/db/appSettings.model";

const APP_SETTINGS_TABLE = "app_settings";
const DEFAULT_LANGUAGE = "en";

export type AppSessionState = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  selectedLanguage: string;
  onboardingCompleted: boolean;
};

const setCreatedAndUpdatedAt = (record: AppSettingsModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (record: AppSettingsModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const ensureAppSettingsRecord = async (
  database: Database,
): Promise<AppSettingsModel> => {
  const collection = database.get<AppSettingsModel>(APP_SETTINGS_TABLE);
  const existingSettings = await collection.query().fetch();

  if (existingSettings.length > 0) {
    return existingSettings[0];
  }

  const now = Date.now();
  let createdSettings!: AppSettingsModel;

  await database.write(async () => {
    createdSettings = await collection.create((record) => {
      record.selectedLanguage = DEFAULT_LANGUAGE;
      record.onboardingCompleted = false;
      record.activeUserRemoteId = null;
      record.activeAccountRemoteId = null;
      setCreatedAndUpdatedAt(record, now);
    });
  });

  return createdSettings;
};

export const getAppSessionState = async (
  database: Database,
): Promise<AppSessionState> => {
  const settings = await ensureAppSettingsRecord(database);

  return {
    activeUserRemoteId: settings.activeUserRemoteId,
    activeAccountRemoteId: settings.activeAccountRemoteId,
    selectedLanguage: settings.selectedLanguage,
    onboardingCompleted: settings.onboardingCompleted,
  };
};

export const hasActiveUserSession = async (
  database: Database,
): Promise<boolean> => {
  const session = await getAppSessionState(database);
  return Boolean(session.activeUserRemoteId);
};

export const setActiveUserSession = async (
  database: Database,
  userRemoteId: string,
): Promise<void> => {
  const normalizedUserRemoteId = userRemoteId.trim();

  if (!normalizedUserRemoteId) {
    throw new Error("Cannot set active user session without user remote id.");
  }

  const settings = await ensureAppSettingsRecord(database);

  await database.write(async () => {
    await settings.update((record) => {
      record.activeUserRemoteId = normalizedUserRemoteId;
      record.activeAccountRemoteId = null;
      setUpdatedAt(record, Date.now());
    });
  });
};

export const clearActiveUserSession = async (database: Database): Promise<void> => {
  const settings = await ensureAppSettingsRecord(database);

  await database.write(async () => {
    await settings.update((record) => {
      record.activeUserRemoteId = null;
      record.activeAccountRemoteId = null;
      setUpdatedAt(record, Date.now());
    });
  });
};