import { AuthUser } from "@/feature/session/types/authSession.types";
import {
  createDatabaseFieldEncryptionService,
  isDatabaseFieldEncryptedValue,
} from "@/shared/utils/security/databaseFieldEncryption.service";
import { AuthUserModel } from "../../dataSource/db/authUser.model";

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

export const mapAuthUserModelToDomain = async (
  model: AuthUserModel,
): Promise<AuthUser> => {
  const [
    fullName,
    email,
    phone,
    authProvider,
    profileImageUrl,
    preferredLanguage,
  ] = await Promise.all([
    decryptIfLegacyEncrypted(model.fullName),
    decryptNullableIfLegacyEncrypted(model.email),
    decryptNullableIfLegacyEncrypted(model.phone),
    decryptNullableIfLegacyEncrypted(model.authProvider),
    decryptNullableIfLegacyEncrypted(model.profileImageUrl),
    decryptNullableIfLegacyEncrypted(model.preferredLanguage),
  ]);

  return {
    remoteId: model.remoteId,
    fullName,
    email,
    phone,
    authProvider,
    profileImageUrl,
    preferredLanguage,
    isEmailVerified: model.isEmailVerified,
    isPhoneVerified: model.isPhoneVerified,
    createdAt: model.createdAt.getTime(),
    updatedAt: model.updatedAt.getTime(),
  };
};
