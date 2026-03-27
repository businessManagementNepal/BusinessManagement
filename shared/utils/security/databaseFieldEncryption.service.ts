import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import {
  bytesToHex,
  bytesToUtf8,
  hexToBytes,
  utf8ToBytes,
} from "@noble/ciphers/utils.js";

export interface DatabaseFieldEncryptionService {
  encrypt(value: string): Promise<string>;
  decrypt(value: string): Promise<string>;
  encryptNullable(value: string | null): Promise<string | null>;
  decryptNullable(value: string | null): Promise<string | null>;
}

const ENCRYPTION_KEY_ALIAS = "elekha_db_encryption_key_v1";
const ENCRYPTION_KEY_SERVICE = "elekha.db.encryption";
const ENCRYPTED_VALUE_PREFIX = "enc.v1";
const ENCRYPTION_KEY_BYTES = 32;
const ENCRYPTION_NONCE_BYTES = 24;
const MIN_ENCRYPTED_CIPHERTEXT_BYTES = 16;

type ParsedEncryptedValue = {
  nonce: Uint8Array;
  ciphertext: Uint8Array;
};

let cachedEncryptionKey: Uint8Array | null = null;
let pendingEncryptionKey: Promise<Uint8Array> | null = null;

const getSecureStoreOptions = (): SecureStore.SecureStoreOptions => ({
  keychainService: ENCRYPTION_KEY_SERVICE,
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

const tryHexToBytes = (value: string): Uint8Array | null => {
  try {
    return hexToBytes(value);
  } catch {
    return null;
  }
};

export const isDatabaseFieldEncryptedValue = (value: string): boolean =>
  value.startsWith(`${ENCRYPTED_VALUE_PREFIX}:`);

const parseEncryptedValue = (value: string): ParsedEncryptedValue | null => {
  if (!isDatabaseFieldEncryptedValue(value)) {
    return null;
  }

  const parts = value.split(":");

  if (parts.length !== 3 || parts[0] !== ENCRYPTED_VALUE_PREFIX) {
    throw new Error("Invalid protected database value format.");
  }

  const nonce = tryHexToBytes(parts[1]);
  const ciphertext = tryHexToBytes(parts[2]);

  if (!nonce || nonce.length !== ENCRYPTION_NONCE_BYTES) {
    throw new Error("Invalid protected database value nonce.");
  }

  if (!ciphertext || ciphertext.length < MIN_ENCRYPTED_CIPHERTEXT_BYTES) {
    throw new Error("Invalid protected database value payload.");
  }

  return { nonce, ciphertext };
};

const loadOrCreateEncryptionKey = async (): Promise<Uint8Array> => {
  const isSecureStoreAvailable = await SecureStore.isAvailableAsync();

  if (!isSecureStoreAvailable) {
    throw new Error("Secure key storage is not available for database encryption.");
  }

  const secureStoreOptions = getSecureStoreOptions();
  const storedKeyHex = await SecureStore.getItemAsync(
    ENCRYPTION_KEY_ALIAS,
    secureStoreOptions,
  );

  if (storedKeyHex) {
    const parsedStoredKey = tryHexToBytes(storedKeyHex);

    if (parsedStoredKey && parsedStoredKey.length === ENCRYPTION_KEY_BYTES) {
      return parsedStoredKey;
    }

    await SecureStore.deleteItemAsync(ENCRYPTION_KEY_ALIAS, secureStoreOptions);
  }

  const generatedKey = await Crypto.getRandomBytesAsync(ENCRYPTION_KEY_BYTES);

  await SecureStore.setItemAsync(
    ENCRYPTION_KEY_ALIAS,
    bytesToHex(generatedKey),
    secureStoreOptions,
  );

  return generatedKey;
};

const getEncryptionKey = async (): Promise<Uint8Array> => {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  if (!pendingEncryptionKey) {
    pendingEncryptionKey = loadOrCreateEncryptionKey().finally(() => {
      pendingEncryptionKey = null;
    });
  }

  const key = await pendingEncryptionKey;
  cachedEncryptionKey = key;

  return key;
};

export const warmDatabaseFieldEncryptionKey = async (): Promise<void> => {
  await getEncryptionKey();
};

const buildEncryptedValue = (
  nonce: Uint8Array,
  ciphertext: Uint8Array,
): string => `${ENCRYPTED_VALUE_PREFIX}:${bytesToHex(nonce)}:${bytesToHex(ciphertext)}`;

export const createDatabaseFieldEncryptionService = (): DatabaseFieldEncryptionService => {
  const encrypt = async (value: string): Promise<string> => {
    if (isDatabaseFieldEncryptedValue(value)) {
      try {
        parseEncryptedValue(value);
        return value;
      } catch {
        // Re-encrypt malformed prefixed values.
      }
    }

    const key = await getEncryptionKey();
    const nonce = await Crypto.getRandomBytesAsync(ENCRYPTION_NONCE_BYTES);
    const plaintextBytes = utf8ToBytes(value);
    const ciphertext = xchacha20poly1305(key, nonce).encrypt(plaintextBytes);

    return buildEncryptedValue(nonce, ciphertext);
  };

  const decrypt = async (value: string): Promise<string> => {
    const parsed = parseEncryptedValue(value);

    if (!parsed) {
      return value;
    }

    const key = await getEncryptionKey();

    try {
      const plaintext = xchacha20poly1305(key, parsed.nonce).decrypt(
        parsed.ciphertext,
      );

      return bytesToUtf8(plaintext);
    } catch {
      throw new Error("Failed to decrypt protected database value.");
    }
  };

  return {
    encrypt,
    decrypt,
    async encryptNullable(value: string | null): Promise<string | null> {
      if (value === null) {
        return null;
      }

      return encrypt(value);
    },
    async decryptNullable(value: string | null): Promise<string | null> {
      if (value === null) {
        return null;
      }

      return decrypt(value);
    },
  };
};

