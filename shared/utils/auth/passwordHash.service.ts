import * as Crypto from "expo-crypto";

export interface PasswordHashService {
  hash(value: string, salt: string): Promise<string>;
  compare(value: string, salt: string, hash: string): Promise<boolean>;
}

const HASH_SEPARATOR = "::";
const HASH_ALGORITHM = Crypto.CryptoDigestAlgorithm.SHA256;

const buildHashInput = (value: string, salt: string): string =>
  `${salt}${HASH_SEPARATOR}${value}`;

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

export const createPasswordHashService = (): PasswordHashService => ({
  async hash(value: string, salt: string): Promise<string> {
    return Crypto.digestStringAsync(
      HASH_ALGORITHM,
      buildHashInput(value, salt),
    );
  },

  async compare(
    value: string,
    salt: string,
    hash: string,
  ): Promise<boolean> {
    const computedHash = await Crypto.digestStringAsync(
      HASH_ALGORITHM,
      buildHashInput(value, salt),
    );

    return timingSafeEqual(computedHash, hash);
  },
});