import {
    AuthCredential
} from "@/feature/session/types/authSession.types";
import { AuthCredentialModel } from "../../dataSource/db/authCredential.model";

export const mapAuthCredentialModelToDomain = (
  model: AuthCredentialModel,
): AuthCredential => ({
  remoteId: model.remoteId,
  userRemoteId: model.userRemoteId,
  loginId: model.loginId,
  credentialType: model.credentialType,
  passwordHash: model.passwordHash,
  passwordSalt: model.passwordSalt,
  hint: model.hint,
  lastLoginAt: model.lastLoginAt,
  isActive: model.isActive,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});
