import { AuthCredentialRepository } from "@/feature/session/data/repository/authCredential.repository";
import {
  ChangePasswordPayload,
  SettingsAuthError,
  SettingsOperationResult,
  SettingsValidationError,
} from "@/feature/appSettings/settings/types/settings.types";
import { PasswordHashService } from "@/shared/utils/auth/passwordHash.service";
import { ChangePasswordUseCase } from "./changePassword.useCase";

export const createChangePasswordUseCase = (
  authCredentialRepository: AuthCredentialRepository,
  passwordHashService: PasswordHashService,
): ChangePasswordUseCase => ({
  async execute(payload: ChangePasswordPayload): Promise<SettingsOperationResult> {
    const normalizedUserRemoteId = payload.userRemoteId.trim();
    const currentPassword = payload.currentPassword;
    const nextPassword = payload.nextPassword;
    const confirmPassword = payload.confirmPassword;

    if (!normalizedUserRemoteId) {
      return {
        success: false,
        error: SettingsValidationError("An active user is required to change password."),
      };
    }

    if (!currentPassword.trim()) {
      return {
        success: false,
        error: SettingsValidationError("Current password is required."),
      };
    }

    if (!nextPassword.trim()) {
      return {
        success: false,
        error: SettingsValidationError("New password is required."),
      };
    }

    if (!confirmPassword.trim()) {
      return {
        success: false,
        error: SettingsValidationError("Confirm the new password to continue."),
      };
    }

    if (nextPassword !== confirmPassword) {
      return {
        success: false,
        error: SettingsValidationError("New password and confirm password must match."),
      };
    }

    const authCredentialResult =
      await authCredentialRepository.getAuthCredentialByUserRemoteId(
        normalizedUserRemoteId,
      );

    if (!authCredentialResult.success) {
      return {
        success: false,
        error: SettingsAuthError(authCredentialResult.error.message),
      };
    }

    const authCredential = authCredentialResult.value;
    const isCurrentPasswordValid = await passwordHashService.compare(
      currentPassword,
      authCredential.passwordSalt,
      authCredential.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      return {
        success: false,
        error: SettingsValidationError("Current password is incorrect."),
      };
    }

    const nextPasswordSalt = await passwordHashService.generateSalt();
    const nextPasswordHash = await passwordHashService.hash(
      nextPassword,
      nextPasswordSalt,
    );

    const saveResult = await authCredentialRepository.saveAuthCredential({
      remoteId: authCredential.remoteId,
      userRemoteId: authCredential.userRemoteId,
      loginId: authCredential.loginId,
      credentialType: authCredential.credentialType,
      passwordHash: nextPasswordHash,
      passwordSalt: nextPasswordSalt,
      hint: authCredential.hint,
      isActive: authCredential.isActive,
    });

    if (!saveResult.success) {
      return {
        success: false,
        error: SettingsAuthError(saveResult.error.message),
      };
    }

    return { success: true, value: true };
  },
});
