import { AuthCredential } from "@/feature/session/types/authSession.types";
import { createDatabaseFieldEncryptionService } from "@/shared/utils/security/databaseFieldEncryption.service";
import { AuthCredentialModel } from "../../dataSource/db/authCredential.model";

const databaseFieldEncryptionService = createDatabaseFieldEncryptionService();

export const mapAuthCredentialModelToDomain = async (
  model: AuthCredentialModel,
): Promise<AuthCredential> => ({
  remoteId: model.remoteId,
  userRemoteId: model.userRemoteId,
  loginId: model.loginId,
  credentialType: model.credentialType,
  passwordHash: await databaseFieldEncryptionService.decrypt(model.passwordHash),
  passwordSalt: await databaseFieldEncryptionService.decrypt(model.passwordSalt),
  hint: await databaseFieldEncryptionService.decryptNullable(model.hint),
  lastLoginAt: model.lastLoginAt,
  isActive: model.isActive,
  failedAttemptCount: model.failedAttemptCount ?? 0,
  lockoutUntil: model.lockoutUntil,
  lastFailedLoginAt: model.lastFailedLoginAt,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});
