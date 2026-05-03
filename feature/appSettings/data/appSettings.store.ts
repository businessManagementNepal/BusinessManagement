import { Database, Q } from "@nozbe/watermelondb";
import { AppSettingsModel } from "./dataSource/db/appSettings.model";
import {
  SETTINGS_BIOMETRIC_LOGIN_AVAILABLE,
  SETTINGS_DEFAULT_APPEARANCE,
  SETTINGS_TWO_FACTOR_AUTH_AVAILABLE,
} from "@/feature/appSettings/settings/constants/settings.constants";

const APP_SETTINGS_TABLE = "app_settings";
const APP_SETTINGS_SINGLETON_ID = "singleton";
const DEFAULT_LANGUAGE = "en";
const DEFAULT_THEME_PREFERENCE = SETTINGS_DEFAULT_APPEARANCE.themePreference;
const DEFAULT_TEXT_SIZE_PREFERENCE =
  SETTINGS_DEFAULT_APPEARANCE.textSizePreference;
const DEFAULT_COMPACT_MODE_ENABLED =
  SETTINGS_DEFAULT_APPEARANCE.compactModeEnabled;

let pendingEnsureAppSettingsRecord: Promise<AppSettingsModel> | null = null;

type SqlQueryArg = string | number | null;

type AppSettingsTableInfoRow = {
  name?: string | null;
};

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

export type SyncPreferenceState = {
  syncEnabled: boolean;
};

export type AppAppearanceState = {
  themePreference: string;
  textSizePreference: string;
  compactModeEnabled: boolean;
  updatedAt: number;
};

const normalizeSyncEnabled = (value: boolean | null | undefined): boolean => {
  return value === true;
};

const normalizeStringValue = (
  value: string | null | undefined,
  fallbackValue: string,
): string => {
  const normalizedValue =
    typeof value === "string" ? value.trim().toLowerCase() : "";
  return normalizedValue || fallbackValue;
};

const normalizeThemePreference = (value: string | null | undefined): string => {
  return normalizeStringValue(value, DEFAULT_THEME_PREFERENCE);
};

const normalizeTextSizePreference = (
  value: string | null | undefined,
): string => {
  return normalizeStringValue(value, DEFAULT_TEXT_SIZE_PREFERENCE);
};

const normalizeCompactModeEnabled = (
  value: boolean | null | undefined,
): boolean => {
  return value === true;
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

  target.appearanceThemePreference = normalizeThemePreference(
    source.appearanceThemePreference,
  );
  target.appearanceTextSizePreference = normalizeTextSizePreference(
    source.appearanceTextSizePreference,
  );
  target.appearanceCompactModeEnabled = normalizeCompactModeEnabled(
    source.appearanceCompactModeEnabled,
  );
  target.syncEnabled = normalizeSyncEnabled(source.syncEnabled);
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

        record.appearanceThemePreference = DEFAULT_THEME_PREFERENCE;
        record.appearanceTextSizePreference = DEFAULT_TEXT_SIZE_PREFERENCE;
        record.appearanceCompactModeEnabled = DEFAULT_COMPACT_MODE_ENABLED;
        record.syncEnabled = false;
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
      existingSettings.find(
        (record) => record.id === APP_SETTINGS_SINGLETON_ID,
      ) ?? null;

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

const persistSecurityPreferenceNormalization = async (
  database: Database,
  settings: AppSettingsModel,
): Promise<void> => {
  const shouldDisableBiometric =
    !SETTINGS_BIOMETRIC_LOGIN_AVAILABLE &&
    Boolean(settings.biometricLoginEnabled);
  const shouldDisableTwoFactor =
    !SETTINGS_TWO_FACTOR_AUTH_AVAILABLE &&
    Boolean(settings.twoFactorAuthEnabled);

  if (!shouldDisableBiometric && !shouldDisableTwoFactor) {
    return;
  }

  await database.write(async () => {
    await settings.update((record) => {
      if (shouldDisableBiometric) {
        record.biometricLoginEnabled = false;
      }

      if (shouldDisableTwoFactor) {
        record.twoFactorAuthEnabled = false;
      }

      setUpdatedAt(record, Date.now());
    });
  });
};

const APP_SETTINGS_APPEARANCE_COLUMN_DEFINITIONS = [
  {
    name: "appearance_theme_preference",
    sqlType: "TEXT",
  },
  {
    name: "appearance_text_size_preference",
    sqlType: "TEXT",
  },
  {
    name: "appearance_compact_mode_enabled",
    sqlType: "INTEGER",
  },
] as const;

const getAppSettingsColumnNames = async (
  database: Database,
): Promise<Set<string>> => {
  const collection = database.get<AppSettingsModel>(APP_SETTINGS_TABLE);
  const rows = (await collection
    .query(Q.unsafeSqlQuery(`PRAGMA table_info("${APP_SETTINGS_TABLE}")`))
    .unsafeFetchRaw()) as readonly AppSettingsTableInfoRow[];

  return new Set(
    rows
      .map((row) => row.name?.trim() ?? "")
      .filter((columnName) => columnName.length > 0),
  );
};

export const ensureAppSettingsAppearanceColumns = async (
  database: Database,
): Promise<void> => {
  const existingColumnNames = await getAppSettingsColumnNames(database);
  const missingColumnStatements: [string, SqlQueryArg[]][] =
    APP_SETTINGS_APPEARANCE_COLUMN_DEFINITIONS.filter(
      (column) => !existingColumnNames.has(column.name),
    ).map((column) => [
      `ALTER TABLE "${APP_SETTINGS_TABLE}" ADD COLUMN "${column.name}" ${column.sqlType}`,
      [],
    ]);

  if (missingColumnStatements.length === 0) {
    return;
  }

  await database.write(async () => {
    await database.adapter.unsafeExecute({
      sqls: missingColumnStatements,
    });
  });
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
  await persistSecurityPreferenceNormalization(database, settings);

  return {
    biometricLoginEnabled: SETTINGS_BIOMETRIC_LOGIN_AVAILABLE
      ? Boolean(settings.biometricLoginEnabled)
      : false,
    twoFactorAuthEnabled: SETTINGS_TWO_FACTOR_AUTH_AVAILABLE
      ? Boolean(settings.twoFactorAuthEnabled)
      : false,
  };
};

export const getSyncPreferenceState = async (
  database: Database,
): Promise<SyncPreferenceState> => {
  const settings = await ensureAppSettingsRecord(database);

  return {
    syncEnabled: normalizeSyncEnabled(settings.syncEnabled),
  };
};

export const setSyncEnabledState = async (
  database: Database,
  enabled: boolean,
): Promise<SyncPreferenceState> => {
  const settings = await ensureAppSettingsRecord(database);
  const normalizedEnabled = enabled === true;

  if (normalizeSyncEnabled(settings.syncEnabled) === normalizedEnabled) {
    return {
      syncEnabled: normalizedEnabled,
    };
  }

  await database.write(async () => {
    await settings.update((record) => {
      record.syncEnabled = normalizedEnabled;
      setUpdatedAt(record, Date.now());
    });
  });

  return {
    syncEnabled: normalizedEnabled,
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

export const getAppearanceSettingsState = async (
  database: Database,
): Promise<AppAppearanceState> => {
  await ensureAppSettingsAppearanceColumns(database);
  const settings = await ensureAppSettingsRecord(database);

  return {
    themePreference: normalizeThemePreference(
      settings.appearanceThemePreference,
    ),
    textSizePreference: normalizeTextSizePreference(
      settings.appearanceTextSizePreference,
    ),
    compactModeEnabled: normalizeCompactModeEnabled(
      settings.appearanceCompactModeEnabled,
    ),
    updatedAt: settings.updatedAt.getTime(),
  };
};

export const setAppearanceSettingsState = async (
  database: Database,
  params: {
    themePreference: string;
    textSizePreference: string;
    compactModeEnabled: boolean;
  },
): Promise<AppAppearanceState> => {
  const normalizedThemePreference = normalizeThemePreference(
    params.themePreference,
  );
  const normalizedTextSizePreference = normalizeTextSizePreference(
    params.textSizePreference,
  );
  const normalizedCompactModeEnabled = normalizeCompactModeEnabled(
    params.compactModeEnabled,
  );

  await ensureAppSettingsAppearanceColumns(database);
  const settings = await ensureAppSettingsRecord(database);

  const currentThemePreference = normalizeThemePreference(
    settings.appearanceThemePreference,
  );
  const currentTextSizePreference = normalizeTextSizePreference(
    settings.appearanceTextSizePreference,
  );
  const currentCompactModeEnabled = normalizeCompactModeEnabled(
    settings.appearanceCompactModeEnabled,
  );

  if (
    currentThemePreference === normalizedThemePreference &&
    currentTextSizePreference === normalizedTextSizePreference &&
    currentCompactModeEnabled === normalizedCompactModeEnabled
  ) {
    return {
      themePreference: currentThemePreference,
      textSizePreference: currentTextSizePreference,
      compactModeEnabled: currentCompactModeEnabled,
      updatedAt: settings.updatedAt.getTime(),
    };
  }

  await database.write(async () => {
    await settings.update((record) => {
      record.appearanceThemePreference = normalizedThemePreference;
      record.appearanceTextSizePreference = normalizedTextSizePreference;
      record.appearanceCompactModeEnabled = normalizedCompactModeEnabled;
      setUpdatedAt(record, Date.now());
    });
  });

  return getAppearanceSettingsState(database);
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
