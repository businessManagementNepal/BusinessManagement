import { Database } from "@nozbe/watermelondb";
import { AppSettingsModel } from "./dataSource/db/appSettings.model";

const APP_SETTINGS_TABLE = "app_settings";
const APP_SETTINGS_SINGLETON_ID = "singleton";
const DEFAULT_LANGUAGE = "en";
let pendingEnsureAppSettingsRecord: Promise<AppSettingsModel> | null = null;

export type AppSessionState = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  selectedLanguage: string;
  onboardingCompleted: boolean;
};

export type SecurityPreferenceState = {
  biometricLoginEnabled: boolean;
  twoFactorAuthEnabled: boolean;
};

const setCreatedAndUpdatedAt = (record: AppSettingsModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.created_at = now;
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setUpdatedAt = (record: AppSettingsModel, now: number) => {
  (record as unknown as { _raw: Record<string, number> })._raw.updated_at = now;
};

const setSingletonId = (record: AppSettingsModel) => {
  (record as unknown as { _raw: { id: string } })._raw.id =
    APP_SETTINGS_SINGLETON_ID;
};

const resolveCanonicalSettingsRecord = (
  records: readonly AppSettingsModel[],
): AppSettingsModel | null => {
  if (records.length === 0) {
    return null;
  }

  const sortedRecords = [...records].sort(
    (leftRecord, rightRecord) =>
      rightRecord.updatedAt.getTime() - leftRecord.updatedAt.getTime(),
  );

  return sortedRecords[0] ?? null;
};

const copySettingsValues = (
  source: AppSettingsModel,
  target: AppSettingsModel,
): void => {
  target.selectedLanguage = source.selectedLanguage;
  target.onboardingCompleted = source.onboardingCompleted;
  target.activeUserRemoteId = source.activeUserRemoteId;
  target.activeAccountRemoteId = source.activeAccountRemoteId;
  target.biometricLoginEnabled = Boolean(source.biometricLoginEnabled);
  target.twoFactorAuthEnabled = Boolean(source.twoFactorAuthEnabled);
};

const createSingletonRecord = async (
  database: Database,
  existingRecords: readonly AppSettingsModel[],
): Promise<AppSettingsModel> => {
  const collection = database.get<AppSettingsModel>(APP_SETTINGS_TABLE);
  const now = Date.now();
  const canonicalRecord = resolveCanonicalSettingsRecord(existingRecords);
  let singletonRecord!: AppSettingsModel;

  await database.write(async () => {
    singletonRecord = await collection.create((record) => {
      setSingletonId(record);

      if (canonicalRecord) {
        copySettingsValues(canonicalRecord, record);
      } else {
        record.selectedLanguage = DEFAULT_LANGUAGE;
        record.onboardingCompleted = false;
        record.activeUserRemoteId = null;
        record.activeAccountRemoteId = null;
        record.biometricLoginEnabled = false;
        record.twoFactorAuthEnabled = false;
      }

      setCreatedAndUpdatedAt(record, now);
    });

    for (const existingRecord of existingRecords) {
      await existingRecord.destroyPermanently();
    }
  });

  return singletonRecord;
};

const removeDuplicateRecords = async (
  database: Database,
  singletonRecord: AppSettingsModel,
  allRecords: readonly AppSettingsModel[],
): Promise<void> => {
  const duplicateRecords = allRecords.filter(
    (record) => record.id !== singletonRecord.id,
  );

  if (duplicateRecords.length === 0) {
    return;
  }

  await database.write(async () => {
    for (const duplicateRecord of duplicateRecords) {
      await duplicateRecord.destroyPermanently();
    }
  });
};

const ensureAppSettingsRecord = async (
  database: Database,
): Promise<AppSettingsModel> => {
  if (pendingEnsureAppSettingsRecord) {
    return pendingEnsureAppSettingsRecord;
  }

  pendingEnsureAppSettingsRecord = (async (): Promise<AppSettingsModel> => {
    const collection = database.get<AppSettingsModel>(APP_SETTINGS_TABLE);
    const existingSettings = await collection.query().fetch();
    const singletonRecord =
      existingSettings.find((record) => record.id === APP_SETTINGS_SINGLETON_ID) ??
      null;

    if (singletonRecord) {
      await removeDuplicateRecords(database, singletonRecord, existingSettings);
      return singletonRecord;
    }

    return createSingletonRecord(database, existingSettings);
  })().finally(() => {
    pendingEnsureAppSettingsRecord = null;
  });

  return pendingEnsureAppSettingsRecord;
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

export const getSecurityPreferenceState = async (
  database: Database,
): Promise<SecurityPreferenceState> => {
  const settings = await ensureAppSettingsRecord(database);

  return {
    biometricLoginEnabled: Boolean(settings.biometricLoginEnabled),
    twoFactorAuthEnabled: Boolean(settings.twoFactorAuthEnabled),
  };
};

export const getSelectedLanguage = async (
  database: Database,
): Promise<string> => {
  const sessionState = await getAppSessionState(database);
  return sessionState.selectedLanguage;
};

export const setSelectedLanguage = async (
  database: Database,
  selectedLanguage: string,
): Promise<void> => {
  const normalizedSelectedLanguage = selectedLanguage.trim().toLowerCase();

  if (!normalizedSelectedLanguage) {
    throw new Error(
      "Cannot set selected language without a valid language code.",
    );
  }

  const settings = await ensureAppSettingsRecord(database);

  if (settings.selectedLanguage === normalizedSelectedLanguage) {
    return;
  }

  await database.write(async () => {
    await settings.update((record) => {
      record.selectedLanguage = normalizedSelectedLanguage;
      setUpdatedAt(record, Date.now());
    });
  });
};

export const setBiometricLoginEnabled = async (
  database: Database,
  enabled: boolean,
): Promise<void> => {
  const settings = await ensureAppSettingsRecord(database);

  if (Boolean(settings.biometricLoginEnabled) === enabled) {
    return;
  }

  await database.write(async () => {
    await settings.update((record) => {
      record.biometricLoginEnabled = enabled;
      setUpdatedAt(record, Date.now());
    });
  });
};

export const setTwoFactorAuthEnabled = async (
  database: Database,
  enabled: boolean,
): Promise<void> => {
  const settings = await ensureAppSettingsRecord(database);

  if (Boolean(settings.twoFactorAuthEnabled) === enabled) {
    return;
  }

  await database.write(async () => {
    await settings.update((record) => {
      record.twoFactorAuthEnabled = enabled;
      setUpdatedAt(record, Date.now());
    });
  });
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

export const setActiveAccountSession = async (
  database: Database,
  accountRemoteId: string,
): Promise<void> => {
  const normalizedAccountRemoteId = accountRemoteId.trim();

  if (!normalizedAccountRemoteId) {
    throw new Error(
      "Cannot set active account session without account remote id.",
    );
  }

  const settings = await ensureAppSettingsRecord(database);

  if (!settings.activeUserRemoteId) {
    throw new Error("Cannot set active account session without active user.");
  }

  if (settings.activeAccountRemoteId === normalizedAccountRemoteId) {
    return;
  }

  await database.write(async () => {
    await settings.update((record) => {
      record.activeAccountRemoteId = normalizedAccountRemoteId;
      setUpdatedAt(record, Date.now());
    });
  });
};

export const clearActiveUserSession = async (
  database: Database,
): Promise<void> => {
  const settings = await ensureAppSettingsRecord(database);

  await database.write(async () => {
    await settings.update((record) => {
      record.activeUserRemoteId = null;
      record.activeAccountRemoteId = null;
      setUpdatedAt(record, Date.now());
    });
  });
};
