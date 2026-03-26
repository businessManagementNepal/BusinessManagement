import {
    AuthUser
} from "@/feature/session/types/authSession.types";
import { AuthUserModel } from "../../dataSource/db/authUser.model";

export const mapAuthUserModelToDomain = (model: AuthUserModel): AuthUser => ({
  remoteId: model.remoteId,
  fullName: model.fullName,
  email: model.email,
  phone: model.phone,
  authProvider: model.authProvider,
  profileImageUrl: model.profileImageUrl,
  preferredLanguage: model.preferredLanguage,
  isEmailVerified: model.isEmailVerified,
  isPhoneVerified: model.isPhoneVerified,
  createdAt: model.createdAt.getTime(),
  updatedAt: model.updatedAt.getTime(),
});
