import * as Crypto from "expo-crypto";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";

export interface PasswordHashService {
  hash(value: string, salt: string): Promise<string>;
  compare(value: string, salt: string, hash: string): Promise<boolean>;
  needsRehash(hash: string): boolean;
  generateSalt(): Promise<string>;
}

const LEGACY_HASH_SEPARATOR = "::";
const LEGACY_HASH_ALGORITHM = Crypto.CryptoDigestAlgorithm.SHA256;

const SCRYPT_PREFIX = "scrypt";
const SCRYPT_N = 2 ** 10;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_DK_LEN = 32;

const SCRYPT_N_MIN = 2 ** 10;
const SCRYPT_N_MAX = 2 ** 16;
const SCRYPT_R_MIN = 1;
const SCRYPT_R_MAX = 16;
const SCRYPT_P_MIN = 1;
const SCRYPT_P_MAX = 4;
const SCRYPT_DK_LEN_MIN = 16;
const SCRYPT_DK_LEN_MAX = 64;

const buildLegacyHashInput = (value: string, salt: string): string =>
  `${salt}${LEGACY_HASH_SEPARATOR}${value}`;

const timingSafeEqual = (left: string, right: string): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
};

const encodeScryptHash = (hashHex: string): string =>
  `${SCRYPT_PREFIX}$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${SCRYPT_DK_LEN}$${hashHex}`;

const isPowerOfTwo = (value: number): boolean => (value & (value - 1)) === 0;

const isValidScryptParams = (
  N: number,
  r: number,
  p: number,
  dkLen: number,
): boolean => {
  if (!Number.isInteger(N) || !isPowerOfTwo(N)) {
    return false;
  }

  return (
    N >= SCRYPT_N_MIN &&
    N <= SCRYPT_N_MAX &&
    Number.isInteger(r) &&
    r >= SCRYPT_R_MIN &&
    r <= SCRYPT_R_MAX &&
    Number.isInteger(p) &&
    p >= SCRYPT_P_MIN &&
    p <= SCRYPT_P_MAX &&
    Number.isInteger(dkLen) &&
    dkLen >= SCRYPT_DK_LEN_MIN &&
    dkLen <= SCRYPT_DK_LEN_MAX
  );
};

const tryParseHex = (value: string): Uint8Array | null => {
  try {
    return hexToBytes(value);
  } catch {
    return null;
  }
};

const parseScryptHash = (
  hash: string,
): {
  N: number;
  r: number;
  p: number;
  dkLen: number;
  hashHex: string;
} | null => {
  const parts = hash.split("$");

  if (parts.length !== 6 || parts[0] !== SCRYPT_PREFIX) {
    return null;
  }

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const dkLen = Number(parts[4]);
  const hashHex = parts[5];

  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p) || !Number.isFinite(dkLen)) {
    return null;
  }

  if (!hashHex || hashHex.length % 2 !== 0 || tryParseHex(hashHex) === null) {
    return null;
  }

  if (!isValidScryptParams(N, r, p, dkLen)) {
    return null;
  }

  return { N, r, p, dkLen, hashHex };
};

export const createPasswordHashService = (): PasswordHashService => ({
  async hash(value: string, salt: string): Promise<string> {
    const saltBytes = tryParseHex(salt);

    if (!saltBytes) {
      throw new Error("Invalid salt format.");
    }

    const derived = await scryptAsync(value, saltBytes, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      dkLen: SCRYPT_DK_LEN,
    });

    return encodeScryptHash(bytesToHex(derived));
  },

  async compare(value: string, salt: string, hash: string): Promise<boolean> {
    const saltBytes = tryParseHex(salt);

    if (!saltBytes) {
      return false;
    }

    const parsedScrypt = parseScryptHash(hash);

    if (parsedScrypt) {
      const derived = await scryptAsync(value, saltBytes, {
        N: parsedScrypt.N,
        r: parsedScrypt.r,
        p: parsedScrypt.p,
        dkLen: parsedScrypt.dkLen,
      });

      return timingSafeEqual(bytesToHex(derived), parsedScrypt.hashHex);
    }

    const computedHash = await Crypto.digestStringAsync(
      LEGACY_HASH_ALGORITHM,
      buildLegacyHashInput(value, salt),
    );

    return timingSafeEqual(computedHash, hash);
  },

  needsRehash(hash: string): boolean {
    const parsedScrypt = parseScryptHash(hash);

    if (!parsedScrypt) {
      return true;
    }

    return (
      parsedScrypt.N !== SCRYPT_N ||
      parsedScrypt.r !== SCRYPT_R ||
      parsedScrypt.p !== SCRYPT_P ||
      parsedScrypt.dkLen !== SCRYPT_DK_LEN
    );
  },

  async generateSalt(): Promise<string> {
    const saltBytes = await Crypto.getRandomBytesAsync(16);
    return bytesToHex(saltBytes);
  },
});
