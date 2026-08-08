import {
  getAppSessionState,
  setActiveAccountSession,
  setActiveUserSession,
} from "@/feature/appSettings/data/appSettings.store";
import { createLocalProfileDataFilesStore } from "@/feature/appSettings/settings/data/localProfileDataFiles.store";
import { createDeleteLocalProfileDataUseCase } from "@/feature/appSettings/settings/useCase/deleteLocalProfileData.useCase.impl";
import { createLocalLoginRepositoryWithDatabase } from "@/feature/auth/login/factory/local.login.repository.factory";
import { LoginErrorType } from "@/feature/auth/login/types/login.types";
import { createInMemoryWatermelonDatabase } from "@/tests/helpers/inMemoryWatermelonDb.helper";
import { Database } from "@nozbe/watermelondb";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => undefined),
  deleteItemAsync: vi.fn(async () => undefined),
}));

vi.mock("expo-file-system/legacy", () => ({
  cacheDirectory: null,
  documentDirectory: null,
  deleteAsync: vi.fn(async () => undefined),
  getInfoAsync: vi.fn(async () => ({ exists: false })),
  readDirectoryAsync: vi.fn(async () => []),
}));

vi.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  digestStringAsync: vi.fn(async () => "unused"),
  getRandomBytesAsync: vi.fn(async (length: number) => new Uint8Array(length)),
}));

const TABLES = [
  "app_settings",
  "auth_users",
  "auth_credentials",
  "accounts",
  "products",
  "contacts",
  "transactions",
  "ledger_entries",
  "orders",
  "billing_documents",
  "money_accounts",
] as const;

type TestRecord = Record<string, unknown>;

const seedRecord = async (
  database: Database,
  tableName: (typeof TABLES)[number],
  values: TestRecord,
): Promise<void> => {
  const collection = database.get(tableName) as unknown as {
    create(mutator: (record: TestRecord) => void): Promise<unknown>;
  };

  await database.write(async () => {
    await collection.create((record) => {
      Object.assign(record, values);
    });
  });
};

describe("DeleteLocalProfileDataUseCase", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("resets every WatermelonDB table and removes the previous local session", async () => {
    const { database, snapshotTable } = createInMemoryWatermelonDatabase({
      allowedTables: TABLES,
    });

    await setActiveUserSession(database, "user-1");
    await setActiveAccountSession(database, "account-1");

    for (const tableName of TABLES.filter(
      (name) => name !== "app_settings",
    )) {
      await seedRecord(database, tableName, {
        remoteId: `${tableName}-1`,
        userRemoteId: "user-1",
        ownerUserRemoteId: "user-1",
        accountRemoteId: "account-1",
        loginId: "+9779800000000",
      });
    }

    const clearTokens = vi.fn(async () => undefined);
    const clearDeviceId = vi.fn(async () => undefined);
    const clearDatabaseEncryptionKey = vi.fn(async () => undefined);
    const clearLedgerReminders = vi.fn(async () => undefined);
    const clearAppPrivateUserFiles = vi.fn(async () => undefined);
    const resetSpy = vi.spyOn(database, "unsafeResetDatabase");
    const useCase = createDeleteLocalProfileDataUseCase({
      database,
      authTokenStore: { clearTokens },
      deviceIdStore: { clearDeviceId },
      localProfileDataFilesStore: { clearAppPrivateUserFiles },
      clearLedgerReminders,
      clearDatabaseEncryptionKey,
    });

    await expect(useCase.execute()).resolves.toEqual({
      success: true,
      value: true,
    });

    expect(clearLedgerReminders).toHaveBeenCalledTimes(1);
    expect(clearTokens).toHaveBeenCalledTimes(1);
    expect(clearDeviceId).toHaveBeenCalledTimes(1);
    expect(clearDatabaseEncryptionKey).toHaveBeenCalledTimes(1);
    expect(clearAppPrivateUserFiles).toHaveBeenCalledTimes(1);
    expect(resetSpy).toHaveBeenCalledTimes(1);
    const cleanupOrder = [
      clearLedgerReminders,
      clearTokens,
      clearDeviceId,
      clearDatabaseEncryptionKey,
      clearAppPrivateUserFiles,
      resetSpy,
    ].map((mock) => mock.mock.invocationCallOrder[0] ?? 0);
    expect(cleanupOrder).toEqual([...cleanupOrder].sort((left, right) => left - right));

    for (const tableName of TABLES) {
      expect(snapshotTable(tableName), tableName).toHaveLength(0);
    }

    const sessionState = await getAppSessionState(database);
    expect(sessionState.activeUserRemoteId).toBeNull();
    expect(sessionState.activeAccountRemoteId).toBeNull();

    const loginRepository = createLocalLoginRepositoryWithDatabase(database);
    const loginResult = await loginRepository.loginWithEmail({
      phoneNumber: "+9779800000000",
      password: "old-password",
    });
    expect(loginResult.success).toBe(false);
    if (!loginResult.success) {
      expect(loginResult.error.type).toBe(LoginErrorType.InvalidCredentials);
    }
  });

  it("does not report success or reset the database when prerequisite cleanup fails", async () => {
    const { database } = createInMemoryWatermelonDatabase({
      allowedTables: TABLES,
    });
    const resetSpy = vi.spyOn(database, "unsafeResetDatabase");
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const useCase = createDeleteLocalProfileDataUseCase({
      database,
      authTokenStore: { clearTokens: vi.fn(async () => undefined) },
      deviceIdStore: { clearDeviceId: vi.fn(async () => undefined) },
      localProfileDataFilesStore: {
        clearAppPrivateUserFiles: vi.fn(async () => {
          throw new Error("file cleanup failed");
        }),
      },
      clearLedgerReminders: vi.fn(async () => undefined),
      clearDatabaseEncryptionKey: vi.fn(async () => undefined),
    });

    const result = await useCase.execute();

    expect(result.success).toBe(false);
    expect(resetSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Local eLekha data deletion failed.",
      "Error",
    );
  });
});

describe("LocalProfileDataFilesStore", () => {
  it("clears app-private cache and export directories without touching external exports", async () => {
    const externalExportUri =
      "content://com.android.externalstorage.documents/Download/elekha-export.csv";
    const deleteAsync = vi.fn(async () => undefined);
    const getInfoAsync = vi.fn(async () => ({ exists: true }));
    const readDirectoryAsync = vi.fn(async () => [
      "elekha-export-2026-08-08.csv",
      "temporary-report.pdf",
    ]);
    const store = createLocalProfileDataFilesStore({
      fileSystem: {
        cacheDirectory: "file:///elekha/cache/",
        documentDirectory: "file:///elekha/documents/",
        deleteAsync,
        getInfoAsync,
        readDirectoryAsync,
      } as never,
    });

    await store.clearAppPrivateUserFiles();

    expect(deleteAsync).toHaveBeenCalledWith(
      "file:///elekha/cache/elekha-export-2026-08-08.csv",
      { idempotent: true },
    );
    expect(deleteAsync).toHaveBeenCalledWith(
      "file:///elekha/cache/temporary-report.pdf",
      { idempotent: true },
    );
    expect(deleteAsync).toHaveBeenCalledWith(
      "file:///elekha/documents/exports/",
      { idempotent: true },
    );
    expect(deleteAsync).toHaveBeenCalledWith(
      "file:///elekha/documents/reports-exports/",
      { idempotent: true },
    );
    expect(deleteAsync).not.toHaveBeenCalledWith(
      externalExportUri,
      expect.anything(),
    );
  });
});
