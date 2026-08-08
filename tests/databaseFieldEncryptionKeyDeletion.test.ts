import {
  clearDatabaseFieldEncryptionKey,
  createDatabaseFieldEncryptionService,
} from "@/shared/utils/security/databaseFieldEncryption.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

const secureStoreMock = vi.hoisted(() => {
  const values = new Map<string, string>();

  return {
    values,
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
    reset: () => {
      sequence = 0;
    },
    getRandomBytesAsync: vi.fn(async (length: number) => {
      sequence += 1;
      return Uint8Array.from(
        { length },
        (_value, index) => (index + sequence) % 256,
      );
    }),
  };
});

vi.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
  isAvailableAsync: vi.fn(async () => true),
  getItemAsync: secureStoreMock.getItemAsync,
  setItemAsync: secureStoreMock.setItemAsync,
  deleteItemAsync: secureStoreMock.deleteItemAsync,
}));

vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: cryptoMock.getRandomBytesAsync,
}));

describe("database field encryption key deletion", () => {
  beforeEach(async () => {
    secureStoreMock.values.clear();
    cryptoMock.reset();
    vi.clearAllMocks();
    await clearDatabaseFieldEncryptionKey();
    vi.clearAllMocks();
  });

  it("removes the SecureStore key and clears the in-memory key cache", async () => {
    const encryptionService = createDatabaseFieldEncryptionService();

    await encryptionService.encrypt("first local credential");
    expect(secureStoreMock.setItemAsync).toHaveBeenCalledTimes(1);

    await clearDatabaseFieldEncryptionKey();

    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalledWith(
      "elekha_db_encryption_key_v1",
      {
        keychainService: "elekha.db.encryption",
        keychainAccessible: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
      },
    );
    expect(secureStoreMock.values.has("elekha_db_encryption_key_v1")).toBe(
      false,
    );

    vi.clearAllMocks();
    await encryptionService.encrypt("new local credential");
    expect(secureStoreMock.setItemAsync).toHaveBeenCalledTimes(1);
  });
});
