import { UserManagementRepository } from "../data/repository/userManagement.repository";
import {
  AccountUserRoleAssignmentResult,
  AssignUserManagementRolePayload,
  UserManagementForbiddenError,
  UserManagementValidationError,
} from "../types/userManagement.types";
import { AssignUserManagementRoleUseCase } from "./assignUserManagementRole.useCase";

const ASSIGN_ROLE_PERMISSION_CODE = "user_management.assign_role";

const normalizeRequired = (value: string): string => value.trim();

export const createAssignUserManagementRoleUseCase = (
  userManagementRepository: UserManagementRepository,
): AssignUserManagementRoleUseCase => ({
  async execute(
    payload: AssignUserManagementRolePayload,
  ): Promise<AccountUserRoleAssignmentResult> {
    const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
    const normalizedActorUserRemoteId = normalizeRequired(payload.actorUserRemoteId ?? "");
    const normalizedUserRemoteId = normalizeRequired(payload.userRemoteId);
    const normalizedRoleRemoteId = normalizeRequired(payload.roleRemoteId);

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

    if (!normalizedUserRemoteId) {
      return {
        success: false,
        error: UserManagementValidationError("User remote id is required."),
      };
    }

    if (!normalizedRoleRemoteId) {
      return {
        success: false,
        error: UserManagementValidationError("Role remote id is required."),
      };
    }

    const permissionCodesResult = await userManagementRepository.getPermissionCodesByAccountUser(
      {
        accountRemoteId: normalizedAccountRemoteId,
        userRemoteId: normalizedActorUserRemoteId,
      },
    );

    if (!permissionCodesResult.success) {
      return permissionCodesResult;
    }

    if (!permissionCodesResult.value.includes(ASSIGN_ROLE_PERMISSION_CODE)) {
      return {
        success: false,
        error: UserManagementForbiddenError("You do not have permission to assign roles."),
      };
    }

    return userManagementRepository.assignUserRole({
      accountRemoteId: normalizedAccountRemoteId,
      actorUserRemoteId: normalizedActorUserRemoteId,
      userRemoteId: normalizedUserRemoteId,
      roleRemoteId: normalizedRoleRemoteId,
    });
  },
});
