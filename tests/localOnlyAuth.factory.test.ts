import { createLocalLoginRepositoryWithDatabase } from "@/feature/auth/login/factory/local.login.repository.factory";
import { LoginErrorType } from "@/feature/auth/login/types/login.types";
import { createLocalSignUpRepositoryWithDatabase } from "@/feature/auth/signUp/factory/local.signUp.repository.factory";
import {
  SignUpErrorType,
  SignUpInput,
  SignUpProfileType,
} from "@/feature/auth/signUp/types/signUp.types";
import { BUSINESS_TYPE_VALUES } from "@/shared/constants/businessType.constants";
import { createInMemoryWatermelonDatabase } from "@/tests/helpers/inMemoryWatermelonDb.helper";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localSessionMock = vi.hoisted(() => ({
  setActiveUserSession: vi.fn(async () => undefined),
}));

const secureStoreMock = vi.hoisted(() => {
  const values = new Map<string, string>();

  return {
    values,
    isAvailableAsync: vi.fn(async () => true),
    getItemAsync: vi.fn(async (key: string) => values.get(key) ?? null),
    setItemAsync: vi.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    deleteItemAsync: vi.fn(async (key: string) => {
      values.delete(key);
    }),
  };
});

const cryptoMock = vi.hoisted(() => {
  let sequence = 0;

  return {
    reset() {
      sequence = 0;
    },
    randomUUID: vi.fn(() => `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`),
    getRandomBytesAsync: vi.fn(async (length: number) => {
      sequence += 1;
      return Uint8Array.from(
        { length },
        (_value, index) => (index + sequence) % 256,
      );
    }),
    digestStringAsync: vi.fn(async () => "unused-legacy-digest"),
  };
});

vi.mock("@/feature/appSettings/data/appSettings.store", () => localSessionMock);

vi.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
  isAvailableAsync: secureStoreMock.isAvailableAsync,
  getItemAsync: secureStoreMock.getItemAsync,
  setItemAsync: secureStoreMock.setItemAsync,
  deleteItemAsync: secureStoreMock.deleteItemAsync,
}));

vi.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: {
    SHA256: "SHA-256",
  },
  randomUUID: cryptoMock.randomUUID,
  getRandomBytesAsync: cryptoMock.getRandomBytesAsync,
  digestStringAsync: cryptoMock.digestStringAsync,
}));

const AUTH_TABLES = ["auth_users", "auth_credentials", "accounts"] as const;
const LOCAL_PASSWORD = "localPass123";
const LOCAL_PHONE = "+9779800000000";

const SIGN_UP_PAYLOAD: SignUpInput = {
  fullName: "Offline Owner",
  phoneNumber: LOCAL_PHONE,
  password: LOCAL_PASSWORD,
  profileType: SignUpProfileType.Business,
  businessType: BUSINESS_TYPE_VALUES[0],
};

describe("local-only authentication factories", () => {
  let originalApiBaseUrl: string | undefined;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    delete process.env.EXPO_PUBLIC_API_BASE_URL;

    fetchMock = vi.fn(async () => {
      throw new Error("Backend requests are unavailable in offline auth tests.");
    });
    vi.stubGlobal("fetch", fetchMock);

    cryptoMock.reset();
    secureStoreMock.values.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalApiBaseUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    }

    vi.unstubAllGlobals();
  });

  it("signs up offline and creates a local session, hashed credential, and business account", async () => {
    const { database, snapshotTable } = createInMemoryWatermelonDatabase({
      allowedTables: AUTH_TABLES,
    });
    const repository = createLocalSignUpRepositoryWithDatabase(database);

    const result = await repository.signUpWithEmail(SIGN_UP_PAYLOAD);

    expect(result.success).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localSessionMock.setActiveUserSession).toHaveBeenCalledTimes(1);

    if (!result.success) {
      return;
    }

    expect(localSessionMock.setActiveUserSession).toHaveBeenCalledWith(
      database,
      result.value.authUser.remoteId,
    );
    expect(snapshotTable("auth_users")).toHaveLength(1);

    const credentials = snapshotTable("auth_credentials");
    expect(credentials).toHaveLength(1);
    expect(credentials[0]?.passwordHash).not.toBe(LOCAL_PASSWORD);
    expect(String(credentials[0]?.passwordHash)).toContain("enc.v1:");
    expect(String(credentials[0]?.passwordSalt)).toContain("enc.v1:");

    const accounts = snapshotTable("accounts");
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({
      ownerUserRemoteId: result.value.authUser.remoteId,
      accountType: SignUpProfileType.Business,
      businessType: BUSINESS_TYPE_VALUES[0],
      isActive: true,
      isDefault: true,
    });
  });

  it("keeps duplicate local phone validation without requiring remote identity services", async () => {
    const { database, snapshotTable } = createInMemoryWatermelonDatabase({
      allowedTables: AUTH_TABLES,
    });
    const repository = createLocalSignUpRepositoryWithDatabase(database);

    const firstResult = await repository.signUpWithEmail(SIGN_UP_PAYLOAD);
    const duplicateResult = await repository.signUpWithEmail(SIGN_UP_PAYLOAD);

    expect(firstResult.success).toBe(true);
    expect(duplicateResult.success).toBe(false);
    if (!duplicateResult.success) {
      expect(duplicateResult.error.type).toBe(
        SignUpErrorType.PhoneNumberAlreadyInUse,
      );
    }
    expect(snapshotTable("auth_users")).toHaveLength(1);
    expect(snapshotTable("auth_credentials")).toHaveLength(1);
    expect(snapshotTable("accounts")).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("logs an existing local user in after factory reconstruction and rejects a wrong password", async () => {
    const { database } = createInMemoryWatermelonDatabase({
      allowedTables: AUTH_TABLES,
    });
    const signUpRepository = createLocalSignUpRepositoryWithDatabase(database);
    const signUpResult = await signUpRepository.signUpWithEmail(SIGN_UP_PAYLOAD);
    expect(signUpResult.success).toBe(true);

    localSessionMock.setActiveUserSession.mockClear();

    const reconstructedLoginRepository =
      createLocalLoginRepositoryWithDatabase(database);
    const invalidResult = await reconstructedLoginRepository.loginWithEmail({
      phoneNumber: LOCAL_PHONE,
      password: "incorrectPass123",
    });

    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error.type).toBe(LoginErrorType.InvalidCredentials);
    }
    expect(localSessionMock.setActiveUserSession).not.toHaveBeenCalled();

    const loginResult = await reconstructedLoginRepository.loginWithEmail({
      phoneNumber: LOCAL_PHONE,
      password: LOCAL_PASSWORD,
    });

    expect(loginResult.success).toBe(true);
    expect(localSessionMock.setActiveUserSession).toHaveBeenCalledTimes(1);
    if (loginResult.success) {
      expect(localSessionMock.setActiveUserSession).toHaveBeenCalledWith(
        database,
        loginResult.value.authUser.remoteId,
      );
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
