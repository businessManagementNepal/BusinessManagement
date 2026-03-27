import { AuthCredential } from "@/feature/session/types/authSession.types";
import {
  createDatabaseFieldEncryptionService,
  isDatabaseFieldEncryptedValue,
} from "@/shared/utils/security/databaseFieldEncryption.service";
import { AuthCredentialModel } from "../../dataSource/db/authCredential.model";

const databaseFieldEncryptionService = createDatabaseFieldEncryptionService();

const decryptIfLegacyEncrypted = async (value: string): Promise<string> => {
  if (!isDatabaseFieldEncryptedValue(value)) {
    return value;
  }

  return databaseFieldEncryptionService.decrypt(value);
};

const decryptNullableIfLegacyEncrypted = async (
  value: string | null,
): Promise<string | null> => {
  if (value === null || !isDatabaseFieldEncryptedValue(value)) {
    return value;
  }

  return databaseFieldEncryptionService.decrypt(value);
};

export const mapAuthCredentialModelToDomain = async (
  model: AuthCredentialModel,
): Promise<AuthCredential> => {
  const [passwordHash, passwordSalt, hint] = await Promise.all([
    decryptIfLegacyEncrypted(model.passwordHash),
    decryptIfLegacyEncrypted(model.passwordSalt),
    decryptNullableIfLegacyEncrypted(model.hint),
  ]);

  return {
    remoteId: model.remoteId,
    userRemoteId: model.userRemoteId,
    loginId: model.loginId,
    credentialType: model.credentialType,
    passwordHash,
    passwordSalt,
    hint,
    lastLoginAt: model.lastLoginAt,
    isActive: model.isActive,
    failedAttemptCount: model.failedAttemptCount ?? 0,
    lockoutUntil: model.lockoutUntil,
    lastFailedLoginAt: model.lastFailedLoginAt,
    createdAt: model.createdAt.getTime(),
    updatedAt: model.updatedAt.getTime(),
  };
};
