import { AuthUser } from "@/feature/session/types/authSession.types";
import { createDatabaseFieldEncryptionService } from "@/shared/utils/security/databaseFieldEncryption.service";
import { AuthUserModel } from "../../dataSource/db/authUser.model";

const databaseFieldEncryptionService = createDatabaseFieldEncryptionService();

export const mapAuthUserModelToDomain = async (
  model: AuthUserModel,
): Promise<AuthUser> => ({
  remoteId: model.remoteId,
  fullName: await databaseFieldEncryptionService.decrypt(model.fullName),
  email: await databaseFieldEncryptionService.decryptNullable(model.email),
  phone: await databaseFieldEncryptionService.decryptNullable(model.phone),
  authProvider: await databaseFieldEncryptionService.decryptNullable(
    model.authProvider,
  ),
  profileImageUrl: await databaseFieldEncryptionService.decryptNullable(
    model.profileImageUrl,
  ),
  preferredLanguage: await databaseFieldEncryptionService.decryptNullable(
    model.preferredLanguage,
  ),
  isEmailVerified: model.isEmailVerified,
  isPhoneVerified: model.isPhoneVerified,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});
