import { UserManagementRepository } from "../data/repository/userManagement.repository";
import {
  SaveUserManagementRoleCommandPayload,
  SaveUserManagementRolePayload,
  UserManagementForbiddenError,
  UserManagementRoleResult,
  UserManagementValidationError,
} from "../types/userManagement.types";
import { SaveUserManagementRoleUseCase } from "./saveUserManagementRole.useCase";

const MANAGE_ROLES_PERMISSION_CODE = "user_management.manage_roles";

const normalizeRequired = (value: string): string => value.trim();

const normalizePermissionCodes = (permissionCodes: readonly string[]): string[] => {
  return Array.from(
    new Set(
      permissionCodes
        .map((permissionCode) => permissionCode.trim())
        .filter((permissionCode) => permissionCode.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right));
};

export const createSaveUserManagementRoleUseCase = (
  userManagementRepository: UserManagementRepository,
): SaveUserManagementRoleUseCase => ({
  async execute(
    payload: SaveUserManagementRoleCommandPayload,
  ): Promise<UserManagementRoleResult> {
    const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
    const normalizedActorUserRemoteId = normalizeRequired(
      payload.actorUserRemoteId,
    );
    const normalizedRoleRemoteId =
      payload.remoteId === null ? null : normalizeRequired(payload.remoteId);
    const normalizedRoleName = normalizeRequired(payload.name);
    const normalizedPermissionCodes = normalizePermissionCodes(
      payload.permissionCodes,
    );

    if (!normalizedAccountRemoteId) {
      return {
        success: false,
        error: UserManagementValidationError("Account remote id is required."),
      };
    }

    if (!normalizedActorUserRemoteId) {
      return {
        success: false,
        error: UserManagementValidationError("Actor user remote id is required."),
      };
    }

    if (payload.remoteId !== null && !normalizedRoleRemoteId) {
      return {
        success: false,
        error: UserManagementValidationError("Role remote id is required."),
      };
    }

    if (normalizedRoleName.length < 2) {
      return {
        success: false,
        error: UserManagementValidationError(
          "Role name must be at least 2 characters.",
        ),
      };
    }

    const permissionCodesResult =
      await userManagementRepository.getPermissionCodesByAccountUser({
        accountRemoteId: normalizedAccountRemoteId,
        userRemoteId: normalizedActorUserRemoteId,
      });

    if (!permissionCodesResult.success) {
      return permissionCodesResult;
    }

    if (!permissionCodesResult.value.includes(MANAGE_ROLES_PERMISSION_CODE)) {
      return {
        success: false,
        error: UserManagementForbiddenError(
          "You do not have permission to create or edit roles.",
        ),
      };
    }

    const repositoryPayload: SaveUserManagementRolePayload = {
      remoteId: normalizedRoleRemoteId,
      accountRemoteId: normalizedAccountRemoteId,
      name: normalizedRoleName,
      permissionCodes: normalizedPermissionCodes,
      isSystem: payload.isSystem,
      isDefault: payload.isDefault,
    };

    return userManagementRepository.saveRole(repositoryPayload);
  },
});
