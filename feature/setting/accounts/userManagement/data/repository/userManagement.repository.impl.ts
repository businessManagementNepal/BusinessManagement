import { AccountRepository } from "@/feature/setting/accounts/accountSelection/data/repository/account.repository";
import { AuthUserRepository } from "@/feature/session/data/repository/authUser.repository";
import {
  SaveAuthCredentialPayload,
  SaveAuthUserPayload,
} from "@/feature/session/types/authSession.types";
import {
  USER_MANAGEMENT_OWNER_ROLE_NAME,
  USER_MANAGEMENT_PERMISSION_SEED,
} from "../../types/userManagementPermissionSeed.types";
import {
  AccountMember,
  AccountMemberResult,
  AccountMembersResult,
  AccountMembersWithRoleResult,
  AccountMemberWithRole,
  AccountMemberStatus,
  AccountRemoteIdsResult,
  AccountPermissionCodesResult,
  AccountUserRoleAssignmentResult,
  AssignUserManagementRolePayload,
  ResolveAccountPermissionCodesPayload,
  SaveAccountMemberPayload,
  SaveUserManagementRolePayload,
  UserManagementConflictError,
  UserManagementDatabaseError,
  UserManagementError,
  UserManagementForbiddenError,
  UserManagementNotFoundError,
  UserManagementOperationResult,
  UserManagementPermissionResult,
  UserManagementPermissionsResult,
  UserManagementRoleResult,
  UserManagementRolesResult,
  UserManagementUnknownError,
  UserManagementValidationError,
} from "../../types/userManagement.types";
import {
  AssignAccountUserRoleRecordPayload,
  SaveAccountRoleRecordPayload,
  UserManagementDatasource,
} from "../dataSource/userManagement.datasource";
import { AccountRoleModel } from "../dataSource/db/accountRole.model";
import { UserManagementRepository } from "./userManagement.repository";
import {
  mapAccountMemberModelToDomain,
  mapAccountUserRoleModelToDomain,
  mapPermissionModelToDomain,
  mapRoleModelToDomain,
} from "./mapper/userManagement.mapper";

export type CreateUserManagementRepositoryParams = {
  localDatasource: UserManagementDatasource;
  accountRepository: AccountRepository;
  authUserRepository: AuthUserRepository;
};

const getOwnerRoleRemoteId = (accountRemoteId: string): string => {
  return `owner-${accountRemoteId}`;
};

const createRoleRemoteId = (): string => {
  return `role-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createMemberRemoteId = (): string => {
  return `member-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeRequired = (value: string): string => value.trim();

const normalizePermissionCodes = (permissionCodes: readonly string[]): string[] => {
  return Array.from(
    new Set(permissionCodes.map((permissionCode) => permissionCode.trim()).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
};

const sortPermissions = <TPermission extends { module: string; label: string }>(
  permissions: readonly TPermission[],
): TPermission[] => {
  return [...permissions].sort((left, right) => {
    const moduleCompare = left.module.localeCompare(right.module);
    if (moduleCompare !== 0) {
      return moduleCompare;
    }
    return left.label.localeCompare(right.label);
  });
};

const sortRoles = <TRole extends { isDefault: boolean; isSystem: boolean; name: string }>(
  roles: readonly TRole[],
): TRole[] => {
  return [...roles].sort((left, right) => {
    if (left.isDefault !== right.isDefault) {
      return left.isDefault ? -1 : 1;
    }
    if (left.isSystem !== right.isSystem) {
      return left.isSystem ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });
};

const sortMembersWithRole = (
  members: readonly AccountMemberWithRole[],
): AccountMemberWithRole[] => {
  const statusOrder: Record<AccountMember["status"], number> = {
    [AccountMemberStatus.Active]: 0,
    [AccountMemberStatus.Invited]: 1,
    [AccountMemberStatus.Inactive]: 2,
  };

  return [...members].sort((left, right) => {
    if (left.isAccountOwner !== right.isAccountOwner) {
      return left.isAccountOwner ? -1 : 1;
    }

    const statusCompare = statusOrder[left.status] - statusOrder[right.status];
    if (statusCompare !== 0) {
      return statusCompare;
    }

    return left.fullName.localeCompare(right.fullName);
  });
};

const toErrorWithMessage = (error: Error | unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return new Error((error as { message: string }).message);
  }

  return new Error("Unknown error");
};

const mapUserManagementError = (
  error: Error | unknown,
  fallback: UserManagementError = UserManagementUnknownError,
): UserManagementError => {
  const normalizedError = toErrorWithMessage(error);
  const message = normalizedError.message.toLowerCase();

  if (message.includes("not found")) {
    return UserManagementNotFoundError(normalizedError.message);
  }

  if (message.includes("forbidden")) {
    return UserManagementForbiddenError(normalizedError.message);
  }

  if (message.includes("conflict")) {
    return UserManagementConflictError(normalizedError.message);
  }

  const isDatabaseError =
    message.includes("table") ||
    message.includes("schema") ||
    message.includes("database") ||
    message.includes("adapter") ||
    message.includes("timeout") ||
    message.includes("constraint");

  if (isDatabaseError) {
    return {
      ...UserManagementDatabaseError,
      message: normalizedError.message,
    };
  }

  return {
    ...fallback,
    message: normalizedError.message,
  };
};

type RolePermissionsMap = Map<string, string[]>;

const buildRolePermissionsMap = (
  roleRemoteIds: readonly string[],
  rolePermissionRecords: readonly {
    roleRemoteId: string;
    permissionCode: string;
  }[],
): RolePermissionsMap => {
  const map = new Map<string, string[]>();

  for (const roleRemoteId of roleRemoteIds) {
    map.set(roleRemoteId, []);
  }

  for (const rolePermissionRecord of rolePermissionRecords) {
    const permissionCodes = map.get(rolePermissionRecord.roleRemoteId);
    if (!permissionCodes) {
      continue;
    }
    permissionCodes.push(rolePermissionRecord.permissionCode);
  }

  for (const [roleRemoteId, permissionCodes] of map.entries()) {
    map.set(roleRemoteId, normalizePermissionCodes(permissionCodes));
  }

  return map;
};

const mapRolesWithPermissions = (
  roles: readonly AccountRoleModel[],
  rolePermissionsMap: RolePermissionsMap,
) => {
  return sortRoles(
    roles.map((role) =>
      mapRoleModelToDomain(role, rolePermissionsMap.get(role.remoteId) ?? []),
    ),
  );
};

export const createUserManagementRepository = ({
  localDatasource,
  accountRepository,
  authUserRepository,
}: CreateUserManagementRepositoryParams): UserManagementRepository => {
  const clearDefaultRoleForAccount = async (
    accountRemoteId: string,
    exceptRoleRemoteId: string,
  ): Promise<UserManagementOperationResult> => {
    const rolesResult = await localDatasource.getRolesByAccountRemoteId(accountRemoteId);

    if (!rolesResult.success) {
      return {
        success: false,
        error: mapUserManagementError(rolesResult.error),
      };
    }

    const defaultRolesToClear = rolesResult.value.filter(
      (role) => role.isDefault && role.remoteId !== exceptRoleRemoteId,
    );

    for (const roleToClear of defaultRolesToClear) {
      const saveRoleResult = await localDatasource.saveRole({
        remoteId: roleToClear.remoteId,
        accountRemoteId: roleToClear.accountRemoteId,
        name: roleToClear.name,
        isSystem: roleToClear.isSystem,
        isDefault: false,
      });

      if (!saveRoleResult.success) {
        return {
          success: false,
          error: mapUserManagementError(saveRoleResult.error),
        };
      }
    }

    return { success: true, value: true };
  };

  const getOwnerUserRemoteIdResult = async (
    accountRemoteId: string,
  ): Promise<
    | { success: true; value: string }
    | { success: false; error: UserManagementError }
  > => {
    const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);

    if (!normalizedAccountRemoteId) {
      return {
        success: false,
        error: UserManagementValidationError("Account remote id is required."),
      };
    }

    const accountResult = await accountRepository.getAccountByRemoteId(
      normalizedAccountRemoteId,
    );

    if (!accountResult.success) {
      return {
        success: false,
        error: mapUserManagementError(accountResult.error),
      };
    }

    return { success: true, value: accountResult.value.ownerUserRemoteId };
  };

  const validateRoleAssignment = async (payload: {
    accountRemoteId: string;
    userRemoteId: string;
    roleRemoteId: string;
    actorUserRemoteId?: string | null;
  }): Promise<
    | {
        success: true;
        value: {
          ownerUserRemoteId: string;
          ownerRoleRemoteId: string;
        };
      }
    | { success: false; error: UserManagementError }
  > => {
    const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
    const normalizedUserRemoteId = normalizeRequired(payload.userRemoteId);
    const normalizedRoleRemoteId = normalizeRequired(payload.roleRemoteId);
    const normalizedActorUserRemoteId = payload.actorUserRemoteId
      ? normalizeRequired(payload.actorUserRemoteId)
      : null;

    if (!normalizedAccountRemoteId) {
      return {
        success: false,
        error: UserManagementValidationError("Account remote id is required."),
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

    const ownerUserResult = await getOwnerUserRemoteIdResult(normalizedAccountRemoteId);

    if (!ownerUserResult.success) {
      return ownerUserResult;
    }

    const ownerUserRemoteId = ownerUserResult.value;
    const ownerRoleRemoteId = getOwnerRoleRemoteId(normalizedAccountRemoteId);
    const isTargetOwner = normalizedUserRemoteId === ownerUserRemoteId;

    if (normalizedRoleRemoteId === ownerRoleRemoteId && !isTargetOwner) {
      return {
        success: false,
        error: UserManagementForbiddenError(
          "Owner role can only be assigned to the account owner.",
        ),
      };
    }

    if (isTargetOwner && normalizedRoleRemoteId !== ownerRoleRemoteId) {
      return {
        success: false,
        error: UserManagementForbiddenError(
          "Account owner role assignment cannot be changed.",
        ),
      };
    }

    if (
      normalizedActorUserRemoteId &&
      normalizedActorUserRemoteId !== ownerUserRemoteId &&
      (isTargetOwner || normalizedRoleRemoteId === ownerRoleRemoteId)
    ) {
      return {
        success: false,
        error: UserManagementForbiddenError(
          "Only account owner can modify owner role assignments.",
        ),
      };
    }

    const roleResult = await localDatasource.getRoleByRemoteId(normalizedRoleRemoteId);

    if (!roleResult.success) {
      return {
        success: false,
        error: mapUserManagementError(roleResult.error),
      };
    }

    if (!roleResult.value) {
      return {
        success: false,
        error: UserManagementNotFoundError("Role not found."),
      };
    }

    if (roleResult.value.accountRemoteId !== normalizedAccountRemoteId) {
      return {
        success: false,
        error: UserManagementValidationError(
          "Cannot assign a role from another account.",
        ),
      };
    }

    return {
      success: true,
      value: {
        ownerUserRemoteId,
        ownerRoleRemoteId,
      },
    };
  };

  const repository: UserManagementRepository = {
    async ensurePermissionCatalogSeeded(): Promise<UserManagementOperationResult> {
      const result = await localDatasource.ensurePermissionCatalogSeeded(
        USER_MANAGEMENT_PERMISSION_SEED,
      );

      if (result.success) {
        return { success: true, value: true };
      }

      return {
        success: false,
        error: mapUserManagementError(result.error),
      };
    },

    async getPermissionCatalog(): Promise<UserManagementPermissionsResult> {
      const result = await localDatasource.getPermissionCatalog();

      if (!result.success) {
        return {
          success: false,
          error: mapUserManagementError(result.error),
        };
      }

      return {
        success: true,
        value: sortPermissions(result.value.map((model) => mapPermissionModelToDomain(model))),
      };
    },

    async getPermissionByCode(code: string): Promise<UserManagementPermissionResult> {
      const normalizedCode = normalizeRequired(code);

      if (!normalizedCode) {
        return {
          success: false,
          error: UserManagementValidationError("Permission code is required."),
        };
      }

      const permissionsResult = await repository.getPermissionCatalog();

      if (!permissionsResult.success) {
        return permissionsResult;
      }

      const matchingPermission = permissionsResult.value.find(
        (permission) => permission.code === normalizedCode,
      );

      if (!matchingPermission) {
        return {
          success: false,
          error: UserManagementNotFoundError("Permission not found."),
        };
      }

      return {
        success: true,
        value: matchingPermission,
      };
    },

    async getRolesByAccountRemoteId(
      accountRemoteId: string,
    ): Promise<UserManagementRolesResult> {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);

      if (!normalizedAccountRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Account remote id is required."),
        };
      }

      const rolesResult = await localDatasource.getRolesByAccountRemoteId(
        normalizedAccountRemoteId,
      );

      if (!rolesResult.success) {
        return {
          success: false,
          error: mapUserManagementError(rolesResult.error),
        };
      }

      const roleRemoteIds = rolesResult.value.map((role) => role.remoteId);
      const rolePermissionsResult =
        await localDatasource.getRolePermissionsByRoleRemoteIds(roleRemoteIds);

      if (!rolePermissionsResult.success) {
        return {
          success: false,
          error: mapUserManagementError(rolePermissionsResult.error),
        };
      }

      const rolePermissionsMap = buildRolePermissionsMap(
        roleRemoteIds,
        rolePermissionsResult.value,
      );

      return {
        success: true,
        value: mapRolesWithPermissions(rolesResult.value, rolePermissionsMap),
      };
    },

    async getAccountOwnerUserRemoteId(accountRemoteId: string) {
      return getOwnerUserRemoteIdResult(accountRemoteId);
    },

    async getAccountMemberByRemoteId(memberRemoteId: string): Promise<AccountMemberResult> {
      const normalizedMemberRemoteId = normalizeRequired(memberRemoteId);

      if (!normalizedMemberRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Member remote id is required."),
        };
      }

      const memberResult = await localDatasource.getMemberByRemoteId(normalizedMemberRemoteId);

      if (!memberResult.success) {
        return {
          success: false,
          error: mapUserManagementError(memberResult.error),
        };
      }

      if (!memberResult.value) {
        return {
          success: false,
          error: UserManagementNotFoundError("Account member not found."),
        };
      }

      return {
        success: true,
        value: mapAccountMemberModelToDomain(memberResult.value),
      };
    },

    async getAccountMemberByAccountAndUser(
      accountRemoteId: string,
      userRemoteId: string,
    ): Promise<AccountMemberResult> {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);
      const normalizedUserRemoteId = normalizeRequired(userRemoteId);

      if (!normalizedAccountRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Account remote id is required."),
        };
      }

      if (!normalizedUserRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("User remote id is required."),
        };
      }

      const memberResult = await localDatasource.getMemberByAccountAndUser(
        normalizedAccountRemoteId,
        normalizedUserRemoteId,
      );

      if (!memberResult.success) {
        return {
          success: false,
          error: mapUserManagementError(memberResult.error),
        };
      }

      if (!memberResult.value) {
        return {
          success: false,
          error: UserManagementNotFoundError("Account member not found."),
        };
      }

      return {
        success: true,
        value: mapAccountMemberModelToDomain(memberResult.value),
      };
    },

    async getAccountMembersByAccountRemoteId(
      accountRemoteId: string,
    ): Promise<AccountMembersResult> {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);

      if (!normalizedAccountRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Account remote id is required."),
        };
      }

      const membersResult = await localDatasource.getMembersByAccountRemoteId(
        normalizedAccountRemoteId,
      );

      if (!membersResult.success) {
        return {
          success: false,
          error: mapUserManagementError(membersResult.error),
        };
      }

      return {
        success: true,
        value: membersResult.value.map((member) => mapAccountMemberModelToDomain(member)),
      };
    },

    async getAccountMembersWithRoleByAccountRemoteId(
      accountRemoteId: string,
    ): Promise<AccountMembersWithRoleResult> {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);

      if (!normalizedAccountRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Account remote id is required."),
        };
      }

      const ownerUserResult = await getOwnerUserRemoteIdResult(normalizedAccountRemoteId);

      if (!ownerUserResult.success) {
        return ownerUserResult;
      }

      const [membersResult, assignmentsResult, rolesResult, authUsersResult] =
        await Promise.all([
          localDatasource.getMembersByAccountRemoteId(normalizedAccountRemoteId),
          localDatasource.getUserRoleAssignmentsByAccountRemoteId(
            normalizedAccountRemoteId,
          ),
          repository.getRolesByAccountRemoteId(normalizedAccountRemoteId),
          authUserRepository.getAllAuthUsers(),
        ]);

      if (!membersResult.success) {
        return {
          success: false,
          error: mapUserManagementError(membersResult.error),
        };
      }

      if (!assignmentsResult.success) {
        return {
          success: false,
          error: mapUserManagementError(assignmentsResult.error),
        };
      }

      if (!rolesResult.success) {
        return rolesResult;
      }

      if (!authUsersResult.success) {
        return {
          success: false,
          error: mapUserManagementError(authUsersResult.error),
        };
      }

      const ownerUserRemoteId = ownerUserResult.value;
      const roleNameByRemoteId = new Map(
        rolesResult.value.map((role) => [role.remoteId, role.name]),
      );
      const assignmentByUserRemoteId = new Map(
        assignmentsResult.value.map((assignment) => [
          assignment.userRemoteId,
          assignment.roleRemoteId,
        ]),
      );
      const memberByUserRemoteId = new Map(
        membersResult.value.map((member) => [
          member.userRemoteId,
          mapAccountMemberModelToDomain(member),
        ]),
      );
      const authUserByRemoteId = new Map(
        authUsersResult.value.map((authUser) => [authUser.remoteId, authUser]),
      );
      const candidateUserRemoteIds = new Set<string>([
        ownerUserRemoteId,
        ...memberByUserRemoteId.keys(),
        ...assignmentByUserRemoteId.keys(),
      ]);

      const membersWithRole: AccountMemberWithRole[] = [];

      for (const userRemoteId of candidateUserRemoteIds) {
        const isAccountOwner = userRemoteId === ownerUserRemoteId;
        const member = memberByUserRemoteId.get(userRemoteId);
        const assignedRoleRemoteId =
          assignmentByUserRemoteId.get(userRemoteId) ??
          (isAccountOwner ? getOwnerRoleRemoteId(normalizedAccountRemoteId) : null);
        const profile = authUserByRemoteId.get(userRemoteId);

        membersWithRole.push({
          remoteId: member?.remoteId ?? `member-${normalizedAccountRemoteId}-${userRemoteId}`,
          accountRemoteId: normalizedAccountRemoteId,
          userRemoteId,
          status: member?.status ?? AccountMemberStatus.Active,
          invitedByUserRemoteId: member?.invitedByUserRemoteId ?? null,
          joinedAt: member?.joinedAt ?? null,
          lastActiveAt: member?.lastActiveAt ?? null,
          createdAt: member?.createdAt ?? 0,
          updatedAt: member?.updatedAt ?? 0,
          fullName:
            profile?.fullName ??
            (isAccountOwner ? USER_MANAGEMENT_OWNER_ROLE_NAME : "Unknown User"),
          email: profile?.email ?? null,
          phone: profile?.phone ?? null,
          roleRemoteId: assignedRoleRemoteId,
          roleName: assignedRoleRemoteId
            ? roleNameByRemoteId.get(assignedRoleRemoteId) ??
              (assignedRoleRemoteId === getOwnerRoleRemoteId(normalizedAccountRemoteId)
                ? USER_MANAGEMENT_OWNER_ROLE_NAME
                : null)
            : null,
          isAccountOwner,
        });
      }

      return {
        success: true,
        value: sortMembersWithRole(membersWithRole),
      };
    },

    async saveAccountMember(
      payload: SaveAccountMemberPayload,
    ): Promise<AccountMemberResult> {
      const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
      const normalizedUserRemoteId = normalizeRequired(payload.userRemoteId);
      const normalizedRemoteId = payload.remoteId
        ? normalizeRequired(payload.remoteId)
        : "";

      if (!normalizedAccountRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Account remote id is required."),
        };
      }

      if (!normalizedUserRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("User remote id is required."),
        };
      }

      if (
        payload.status !== AccountMemberStatus.Active &&
        payload.status !== AccountMemberStatus.Inactive &&
        payload.status !== AccountMemberStatus.Invited
      ) {
        return {
          success: false,
          error: UserManagementValidationError("Invalid account member status."),
        };
      }

      const ownerUserResult = await getOwnerUserRemoteIdResult(normalizedAccountRemoteId);

      if (!ownerUserResult.success) {
        return ownerUserResult;
      }

      if (
        ownerUserResult.value === normalizedUserRemoteId &&
        payload.status !== AccountMemberStatus.Active
      ) {
        return {
          success: false,
          error: UserManagementForbiddenError("Account owner cannot be deactivated."),
        };
      }

      const authUserResult = await authUserRepository.getAuthUserByRemoteId(
        normalizedUserRemoteId,
      );

      if (!authUserResult.success) {
        return {
          success: false,
          error: mapUserManagementError(authUserResult.error),
        };
      }

      const existingMemberByRemoteResult = normalizedRemoteId
        ? await localDatasource.getMemberByRemoteId(normalizedRemoteId)
        : { success: true as const, value: null };

      if (!existingMemberByRemoteResult.success) {
        return {
          success: false,
          error: mapUserManagementError(existingMemberByRemoteResult.error),
        };
      }

      const existingMemberByAccountAndUserResult =
        await localDatasource.getMemberByAccountAndUser(
          normalizedAccountRemoteId,
          normalizedUserRemoteId,
        );

      if (!existingMemberByAccountAndUserResult.success) {
        return {
          success: false,
          error: mapUserManagementError(existingMemberByAccountAndUserResult.error),
        };
      }

      const existingMemberByRemote = existingMemberByRemoteResult.value;
      const existingMemberByAccountAndUser = existingMemberByAccountAndUserResult.value;
      const resolvedRemoteId =
        normalizedRemoteId ||
        existingMemberByAccountAndUser?.remoteId ||
        createMemberRemoteId();

      if (
        existingMemberByRemote &&
        existingMemberByRemote.accountRemoteId !== normalizedAccountRemoteId
      ) {
        return {
          success: false,
          error: UserManagementValidationError(
            "Member remote id is already used by a different account.",
          ),
        };
      }

      if (
        existingMemberByAccountAndUser &&
        existingMemberByAccountAndUser.remoteId !== resolvedRemoteId
      ) {
        return {
          success: false,
          error: UserManagementConflictError(
            "A member record already exists for this account user.",
          ),
        };
      }

      const existingMember = existingMemberByRemote ?? existingMemberByAccountAndUser;
      const now = Date.now();
      const joinedAt =
        payload.status === AccountMemberStatus.Invited
          ? null
          : payload.joinedAt ??
            existingMember?.joinedAt ??
            (payload.status === AccountMemberStatus.Active ? now : null);

      const saveResult = await localDatasource.saveMember({
        remoteId: resolvedRemoteId,
        accountRemoteId: normalizedAccountRemoteId,
        userRemoteId: normalizedUserRemoteId,
        status: payload.status,
        invitedByUserRemoteId:
          payload.invitedByUserRemoteId ??
          existingMember?.invitedByUserRemoteId ??
          null,
        joinedAt,
        lastActiveAt:
          payload.lastActiveAt ??
          existingMember?.lastActiveAt ??
          (payload.status === AccountMemberStatus.Active ? now : null),
      });

      if (!saveResult.success) {
        return {
          success: false,
          error: mapUserManagementError(saveResult.error),
        };
      }

      return {
        success: true,
        value: mapAccountMemberModelToDomain(saveResult.value),
      };
    },

    async createMemberAccessTransaction(payload: {
      authUser: SaveAuthUserPayload;
      authCredential: SaveAuthCredentialPayload;
      member: SaveAccountMemberPayload;
      roleRemoteId: string;
    }): Promise<UserManagementOperationResult> {
      const normalizedAccountRemoteId = normalizeRequired(payload.member.accountRemoteId);
      const normalizedMemberUserRemoteId = normalizeRequired(payload.member.userRemoteId);
      const normalizedAuthUserRemoteId = normalizeRequired(payload.authUser.remoteId);
      const normalizedCredentialUserRemoteId = normalizeRequired(
        payload.authCredential.userRemoteId,
      );
      const normalizedRoleRemoteId = normalizeRequired(payload.roleRemoteId);

      if (!normalizedAccountRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Account remote id is required."),
        };
      }

      if (!normalizedMemberUserRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("User remote id is required."),
        };
      }

      if (!normalizedAuthUserRemoteId || !normalizedCredentialUserRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Auth user context is required."),
        };
      }

      if (
        normalizedAuthUserRemoteId !== normalizedMemberUserRemoteId ||
        normalizedCredentialUserRemoteId !== normalizedMemberUserRemoteId
      ) {
        return {
          success: false,
          error: UserManagementValidationError(
            "Auth identity and member identity must match.",
          ),
        };
      }

      if (!normalizedRoleRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Role remote id is required."),
        };
      }

      const roleAssignmentValidationResult = await validateRoleAssignment({
        accountRemoteId: normalizedAccountRemoteId,
        userRemoteId: normalizedMemberUserRemoteId,
        roleRemoteId: normalizedRoleRemoteId,
      });

      if (!roleAssignmentValidationResult.success) {
        return roleAssignmentValidationResult;
      }

      const saveResult = await localDatasource.createMemberAccessRecord({
        authUser: payload.authUser,
        authCredential: payload.authCredential,
        member: {
          remoteId: payload.member.remoteId ?? createMemberRemoteId(),
          accountRemoteId: normalizedAccountRemoteId,
          userRemoteId: normalizedMemberUserRemoteId,
          status: payload.member.status,
          invitedByUserRemoteId: payload.member.invitedByUserRemoteId ?? null,
          joinedAt: payload.member.joinedAt ?? null,
          lastActiveAt: payload.member.lastActiveAt ?? null,
        },
        roleAssignment: {
          accountRemoteId: normalizedAccountRemoteId,
          userRemoteId: normalizedMemberUserRemoteId,
          roleRemoteId: normalizedRoleRemoteId,
        },
      });

      if (!saveResult.success) {
        return {
          success: false,
          error: mapUserManagementError(saveResult.error),
        };
      }

      return { success: true, value: true };
    },

    async updateMemberAccessTransaction(payload: {
      authUser: SaveAuthUserPayload;
      authCredential: SaveAuthCredentialPayload;
      roleAssignment?: AssignUserManagementRolePayload | null;
    }): Promise<UserManagementOperationResult> {
      const normalizedAuthUserRemoteId = normalizeRequired(payload.authUser.remoteId);
      const normalizedCredentialUserRemoteId = normalizeRequired(
        payload.authCredential.userRemoteId,
      );

      if (!normalizedAuthUserRemoteId || !normalizedCredentialUserRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Auth user context is required."),
        };
      }

      if (normalizedAuthUserRemoteId !== normalizedCredentialUserRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError(
            "Auth user and credential user must match.",
          ),
        };
      }

      const normalizedRoleAssignmentPayload = payload.roleAssignment
        ? {
            accountRemoteId: normalizeRequired(payload.roleAssignment.accountRemoteId),
            userRemoteId: normalizeRequired(payload.roleAssignment.userRemoteId),
            roleRemoteId: normalizeRequired(payload.roleAssignment.roleRemoteId),
            actorUserRemoteId: payload.roleAssignment.actorUserRemoteId
              ? normalizeRequired(payload.roleAssignment.actorUserRemoteId)
              : null,
          }
        : null;

      if (normalizedRoleAssignmentPayload) {
        if (
          !normalizedRoleAssignmentPayload.accountRemoteId ||
          !normalizedRoleAssignmentPayload.userRemoteId ||
          !normalizedRoleAssignmentPayload.roleRemoteId
        ) {
          return {
            success: false,
            error: UserManagementValidationError("Role assignment payload is invalid."),
          };
        }

        if (normalizedRoleAssignmentPayload.userRemoteId !== normalizedAuthUserRemoteId) {
          return {
            success: false,
            error: UserManagementValidationError(
              "Role assignment user must match the updated auth user.",
            ),
          };
        }

        const roleAssignmentValidationResult = await validateRoleAssignment({
          accountRemoteId: normalizedRoleAssignmentPayload.accountRemoteId,
          userRemoteId: normalizedRoleAssignmentPayload.userRemoteId,
          roleRemoteId: normalizedRoleAssignmentPayload.roleRemoteId,
          actorUserRemoteId: normalizedRoleAssignmentPayload.actorUserRemoteId,
        });

        if (!roleAssignmentValidationResult.success) {
          return roleAssignmentValidationResult;
        }
      }

      const updateResult = await localDatasource.updateMemberAccessRecord({
        authUser: payload.authUser,
        authCredential: payload.authCredential,
        roleAssignment: normalizedRoleAssignmentPayload
          ? {
              accountRemoteId: normalizedRoleAssignmentPayload.accountRemoteId,
              userRemoteId: normalizedRoleAssignmentPayload.userRemoteId,
              roleRemoteId: normalizedRoleAssignmentPayload.roleRemoteId,
            }
          : null,
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: mapUserManagementError(updateResult.error),
        };
      }

      return { success: true, value: true };
    },

    async deleteAccountMemberByRemoteId(
      memberRemoteId: string,
    ): Promise<UserManagementOperationResult> {
      const normalizedMemberRemoteId = normalizeRequired(memberRemoteId);

      if (!normalizedMemberRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Member remote id is required."),
        };
      }

      const memberResult = await localDatasource.getMemberByRemoteId(normalizedMemberRemoteId);

      if (!memberResult.success) {
        return {
          success: false,
          error: mapUserManagementError(memberResult.error),
        };
      }

      if (!memberResult.value) {
        return { success: true, value: true };
      }

      const ownerUserResult = await getOwnerUserRemoteIdResult(
        memberResult.value.accountRemoteId,
      );

      if (!ownerUserResult.success) {
        return ownerUserResult;
      }

      if (memberResult.value.userRemoteId === ownerUserResult.value) {
        return {
          success: false,
          error: UserManagementForbiddenError("Account owner cannot be removed."),
        };
      }

      const deleteResult = await localDatasource.deleteMemberByRemoteId(
        normalizedMemberRemoteId,
      );

      if (!deleteResult.success) {
        return {
          success: false,
          error: mapUserManagementError(deleteResult.error),
        };
      }

      return { success: true, value: true };
    },

    async getActiveMemberAccountRemoteIdsByUserRemoteId(
      userRemoteId: string,
    ): Promise<AccountRemoteIdsResult> {
      const normalizedUserRemoteId = normalizeRequired(userRemoteId);

      if (!normalizedUserRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("User remote id is required."),
        };
      }

      const result = await localDatasource.getActiveMemberAccountRemoteIdsByUserRemoteId(
        normalizedUserRemoteId,
      );

      if (!result.success) {
        return {
          success: false,
          error: mapUserManagementError(result.error),
        };
      }

      return {
        success: true,
        value: result.value,
      };
    },

    async saveRole(payload: SaveUserManagementRolePayload): Promise<UserManagementRoleResult> {
      const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
      const normalizedName = normalizeRequired(payload.name);
      const normalizedPermissionCodes = normalizePermissionCodes(payload.permissionCodes);

      if (!normalizedAccountRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Account remote id is required."),
        };
      }

      if (!normalizedName) {
        return {
          success: false,
          error: UserManagementValidationError("Role name is required."),
        };
      }

      if (normalizedPermissionCodes.length === 0) {
        return {
          success: false,
          error: UserManagementValidationError(
            "At least one permission is required for a role.",
          ),
        };
      }

      const ensurePermissionsResult = await repository.ensurePermissionCatalogSeeded();

      if (!ensurePermissionsResult.success) {
        return ensurePermissionsResult;
      }

      const permissionCatalogResult = await repository.getPermissionCatalog();

      if (!permissionCatalogResult.success) {
        return permissionCatalogResult;
      }

      const validPermissionCodeSet = new Set(
        permissionCatalogResult.value.map((permission) => permission.code),
      );
      const invalidPermissionCode = normalizedPermissionCodes.find(
        (permissionCode) => !validPermissionCodeSet.has(permissionCode),
      );

      if (invalidPermissionCode) {
        return {
          success: false,
          error: UserManagementValidationError(
            `Permission code is invalid: ${invalidPermissionCode}`,
          ),
        };
      }

      const normalizedRemoteId = payload.remoteId
        ? normalizeRequired(payload.remoteId)
        : createRoleRemoteId();
      const ownerRoleRemoteId = getOwnerRoleRemoteId(normalizedAccountRemoteId);
      const existingRoleResult = await localDatasource.getRoleByRemoteId(normalizedRemoteId);

      if (!existingRoleResult.success) {
        return {
          success: false,
          error: mapUserManagementError(existingRoleResult.error),
        };
      }

      const existingRole = existingRoleResult.value;

      if (!existingRole && normalizedRemoteId === ownerRoleRemoteId) {
        return {
          success: false,
          error: UserManagementForbiddenError(
            "Owner role is managed by system and cannot be replaced.",
          ),
        };
      }

      if (existingRole && existingRole.accountRemoteId !== normalizedAccountRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError(
            "Role remote id is already used by a different account.",
          ),
        };
      }

      if (existingRole?.isSystem) {
        return {
          success: false,
          error: UserManagementValidationError("System roles cannot be edited."),
        };
      }

      const rolesForAccountResult = await localDatasource.getRolesByAccountRemoteId(
        normalizedAccountRemoteId,
      );

      if (!rolesForAccountResult.success) {
        return {
          success: false,
          error: mapUserManagementError(rolesForAccountResult.error),
        };
      }

      const roleNameConflict = rolesForAccountResult.value.find((role) => {
        return (
          role.remoteId !== normalizedRemoteId &&
          role.name.trim().toLowerCase() === normalizedName.toLowerCase()
        );
      });

      if (roleNameConflict) {
        return {
          success: false,
          error: UserManagementConflictError("Role name already exists in this account."),
        };
      }

      const rolePayload: SaveAccountRoleRecordPayload = {
        remoteId: normalizedRemoteId,
        accountRemoteId: normalizedAccountRemoteId,
        name: normalizedName,
        isSystem: payload.isSystem ?? existingRole?.isSystem ?? false,
        isDefault: payload.isDefault ?? existingRole?.isDefault ?? false,
      };

      const saveRoleResult = await localDatasource.saveRole(rolePayload);

      if (!saveRoleResult.success) {
        return {
          success: false,
          error: mapUserManagementError(saveRoleResult.error),
        };
      }

      const replaceRolePermissionsResult = await localDatasource.replaceRolePermissions(
        rolePayload.remoteId,
        normalizedPermissionCodes,
      );

      if (!replaceRolePermissionsResult.success) {
        return {
          success: false,
          error: mapUserManagementError(replaceRolePermissionsResult.error),
        };
      }

      if (rolePayload.isDefault) {
        const clearDefaultRoleResult = await clearDefaultRoleForAccount(
          rolePayload.accountRemoteId,
          rolePayload.remoteId,
        );

        if (!clearDefaultRoleResult.success) {
          return clearDefaultRoleResult;
        }
      }

      return {
        success: true,
        value: mapRoleModelToDomain(saveRoleResult.value, normalizedPermissionCodes),
      };
    },

    async deleteRoleByRemoteId(roleRemoteId: string): Promise<UserManagementOperationResult> {
      const normalizedRoleRemoteId = normalizeRequired(roleRemoteId);

      if (!normalizedRoleRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Role remote id is required."),
        };
      }

      const roleResult = await localDatasource.getRoleByRemoteId(normalizedRoleRemoteId);

      if (!roleResult.success) {
        return {
          success: false,
          error: mapUserManagementError(roleResult.error),
        };
      }

      const role = roleResult.value;

      if (!role) {
        return { success: true, value: true };
      }

      if (role.isSystem || role.isDefault) {
        return {
          success: false,
          error: UserManagementForbiddenError("Default or system roles cannot be deleted."),
        };
      }

      const assignmentsResult = await localDatasource.getUserRoleAssignmentsByAccountRemoteId(
        role.accountRemoteId,
      );

      if (!assignmentsResult.success) {
        return {
          success: false,
          error: mapUserManagementError(assignmentsResult.error),
        };
      }

      const hasAssignments = assignmentsResult.value.some(
        (assignment) => assignment.roleRemoteId === normalizedRoleRemoteId,
      );

      if (hasAssignments) {
        return {
          success: false,
          error: UserManagementConflictError(
            "Role is currently assigned to users. Reassign members before deleting this role.",
          ),
        };
      }

      const deleteRoleResult = await localDatasource.deleteRoleByRemoteId(
        normalizedRoleRemoteId,
      );

      if (!deleteRoleResult.success) {
        return {
          success: false,
          error: mapUserManagementError(deleteRoleResult.error),
        };
      }

      return { success: true, value: true };
    },

    async assignUserRole(
      payload: AssignUserManagementRolePayload,
    ): Promise<AccountUserRoleAssignmentResult> {
      const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
      const normalizedUserRemoteId = normalizeRequired(payload.userRemoteId);
      const normalizedRoleRemoteId = normalizeRequired(payload.roleRemoteId);
      const normalizedActorUserRemoteId = payload.actorUserRemoteId
        ? normalizeRequired(payload.actorUserRemoteId)
        : null;

      if (!normalizedAccountRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Account remote id is required."),
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

      const roleAssignmentValidationResult = await validateRoleAssignment({
        accountRemoteId: normalizedAccountRemoteId,
        userRemoteId: normalizedUserRemoteId,
        roleRemoteId: normalizedRoleRemoteId,
        actorUserRemoteId: normalizedActorUserRemoteId,
      });

      if (!roleAssignmentValidationResult.success) {
        return roleAssignmentValidationResult;
      }

      const existingMemberResult = await localDatasource.getMemberByAccountAndUser(
        normalizedAccountRemoteId,
        normalizedUserRemoteId,
      );

      if (!existingMemberResult.success) {
        return {
          success: false,
          error: mapUserManagementError(existingMemberResult.error),
        };
      }

      const now = Date.now();
      const existingMember = existingMemberResult.value;
      const resolvedStatus = existingMember?.status ?? AccountMemberStatus.Active;
      const saveMemberResult = await localDatasource.saveMember({
        remoteId: existingMember?.remoteId ?? createMemberRemoteId(),
        accountRemoteId: normalizedAccountRemoteId,
        userRemoteId: normalizedUserRemoteId,
        status: resolvedStatus,
        invitedByUserRemoteId:
          normalizedActorUserRemoteId ?? existingMember?.invitedByUserRemoteId ?? null,
        joinedAt:
          existingMember?.joinedAt ??
          (resolvedStatus === AccountMemberStatus.Active ? now : null),
        lastActiveAt:
          resolvedStatus === AccountMemberStatus.Active
            ? now
            : existingMember?.lastActiveAt ?? null,
      });

      if (!saveMemberResult.success) {
        return {
          success: false,
          error: mapUserManagementError(saveMemberResult.error),
        };
      }

      const assignmentPayload: AssignAccountUserRoleRecordPayload = {
        accountRemoteId: normalizedAccountRemoteId,
        userRemoteId: normalizedUserRemoteId,
        roleRemoteId: normalizedRoleRemoteId,
      };
      const assignmentResult = await localDatasource.assignUserRole(assignmentPayload);

      if (!assignmentResult.success) {
        return {
          success: false,
          error: mapUserManagementError(assignmentResult.error),
        };
      }

      return {
        success: true,
        value: mapAccountUserRoleModelToDomain(assignmentResult.value),
      };
    },

    async getUserRoleAssignment(
      accountRemoteId: string,
      userRemoteId: string,
    ): Promise<AccountUserRoleAssignmentResult> {
      const normalizedAccountRemoteId = normalizeRequired(accountRemoteId);
      const normalizedUserRemoteId = normalizeRequired(userRemoteId);

      if (!normalizedAccountRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Account remote id is required."),
        };
      }

      if (!normalizedUserRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("User remote id is required."),
        };
      }

      const assignmentResult = await localDatasource.getUserRoleAssignment(
        normalizedAccountRemoteId,
        normalizedUserRemoteId,
      );

      if (!assignmentResult.success) {
        return {
          success: false,
          error: mapUserManagementError(assignmentResult.error),
        };
      }

      if (!assignmentResult.value) {
        return {
          success: false,
          error: UserManagementNotFoundError("User role assignment not found."),
        };
      }

      return {
        success: true,
        value: mapAccountUserRoleModelToDomain(assignmentResult.value),
      };
    },

    async ensureDefaultOwnerRoleForAccountUser(
      payload: ResolveAccountPermissionCodesPayload,
    ): Promise<UserManagementRoleResult> {
      const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
      const normalizedUserRemoteId = normalizeRequired(payload.userRemoteId);

      if (!normalizedAccountRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Account remote id is required."),
        };
      }

      if (!normalizedUserRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("User remote id is required."),
        };
      }

      const ownerUserResult = await getOwnerUserRemoteIdResult(normalizedAccountRemoteId);

      if (!ownerUserResult.success) {
        return ownerUserResult;
      }

      const ensurePermissionsResult = await repository.ensurePermissionCatalogSeeded();

      if (!ensurePermissionsResult.success) {
        return ensurePermissionsResult;
      }

      const permissionCatalogResult = await repository.getPermissionCatalog();

      if (!permissionCatalogResult.success) {
        return permissionCatalogResult;
      }

      const ownerRoleRemoteId = getOwnerRoleRemoteId(normalizedAccountRemoteId);
      const ownerPermissionCodes = permissionCatalogResult.value.map(
        (permission) => permission.code,
      );
      const ownerRoleResult = await localDatasource.getRoleByRemoteId(ownerRoleRemoteId);

      if (!ownerRoleResult.success) {
        return {
          success: false,
          error: mapUserManagementError(ownerRoleResult.error),
        };
      }

      let ownerRoleModel = ownerRoleResult.value;

      const shouldSaveOwnerRole =
        !ownerRoleModel ||
        ownerRoleModel.accountRemoteId !== normalizedAccountRemoteId ||
        ownerRoleModel.name !== USER_MANAGEMENT_OWNER_ROLE_NAME ||
        !ownerRoleModel.isSystem ||
        !ownerRoleModel.isDefault;

      if (shouldSaveOwnerRole) {
        const ownerRoleSaveResult = await localDatasource.saveRole({
          remoteId: ownerRoleRemoteId,
          accountRemoteId: normalizedAccountRemoteId,
          name: USER_MANAGEMENT_OWNER_ROLE_NAME,
          isSystem: true,
          isDefault: true,
        });

        if (!ownerRoleSaveResult.success) {
          return {
            success: false,
            error: mapUserManagementError(ownerRoleSaveResult.error),
          };
        };

        ownerRoleModel = ownerRoleSaveResult.value;
      }

      const clearDefaultRoleResult = await clearDefaultRoleForAccount(
        normalizedAccountRemoteId,
        ownerRoleRemoteId,
      );

      if (!clearDefaultRoleResult.success) {
        return clearDefaultRoleResult;
      }

      const ownerRolePermissionsResult = await localDatasource.getRolePermissionsByRoleRemoteIds(
        [ownerRoleRemoteId],
      );

      if (!ownerRolePermissionsResult.success) {
        return {
          success: false,
          error: mapUserManagementError(ownerRolePermissionsResult.error),
        };
      }

      const existingOwnerPermissionCodes = normalizePermissionCodes(
        ownerRolePermissionsResult.value.map((rolePermission) => rolePermission.permissionCode),
      );
      const shouldReplaceOwnerPermissions =
        existingOwnerPermissionCodes.length !== ownerPermissionCodes.length ||
        existingOwnerPermissionCodes.some(
          (existingPermissionCode) => !ownerPermissionCodes.includes(existingPermissionCode),
        );

      if (shouldReplaceOwnerPermissions) {
        const ownerPermissionsReplaceResult = await localDatasource.replaceRolePermissions(
          ownerRoleRemoteId,
          ownerPermissionCodes,
        );

        if (!ownerPermissionsReplaceResult.success) {
          return {
            success: false,
            error: mapUserManagementError(ownerPermissionsReplaceResult.error),
          };
        };
      }

      const ownerUserRemoteId = ownerUserResult.value;

      if (normalizedUserRemoteId === ownerUserRemoteId) {
        const ownerMemberResult = await localDatasource.getMemberByAccountAndUser(
          normalizedAccountRemoteId,
          ownerUserRemoteId,
        );

        if (!ownerMemberResult.success) {
          return {
            success: false,
            error: mapUserManagementError(ownerMemberResult.error),
          };
        }

        const existingOwnerMember = ownerMemberResult.value;
        const shouldCreateOwnerMember = !existingOwnerMember;
        const shouldActivateOwnerMember =
          existingOwnerMember !== null &&
          existingOwnerMember.status !== AccountMemberStatus.Active;

        if (shouldCreateOwnerMember || shouldActivateOwnerMember) {
          const now = Date.now();
          const saveOwnerMemberResult = await localDatasource.saveMember({
            remoteId: existingOwnerMember?.remoteId ?? createMemberRemoteId(),
            accountRemoteId: normalizedAccountRemoteId,
            userRemoteId: ownerUserRemoteId,
            status: AccountMemberStatus.Active,
            invitedByUserRemoteId:
              existingOwnerMember?.invitedByUserRemoteId ?? ownerUserRemoteId,
            joinedAt: existingOwnerMember?.joinedAt ?? now,
            lastActiveAt: existingOwnerMember?.lastActiveAt ?? now,
          });

          if (!saveOwnerMemberResult.success) {
            return {
              success: false,
              error: mapUserManagementError(saveOwnerMemberResult.error),
            };
          }
        }

        const ownerAssignmentResult = await localDatasource.getUserRoleAssignment(
          normalizedAccountRemoteId,
          ownerUserRemoteId,
        );

        if (!ownerAssignmentResult.success) {
          return {
            success: false,
            error: mapUserManagementError(ownerAssignmentResult.error),
          };
        }

        if (
          !ownerAssignmentResult.value ||
          ownerAssignmentResult.value.roleRemoteId !== ownerRoleRemoteId
        ) {
          const createdAssignmentResult = await repository.assignUserRole({
            accountRemoteId: normalizedAccountRemoteId,
            actorUserRemoteId: ownerUserRemoteId,
            userRemoteId: ownerUserRemoteId,
            roleRemoteId: ownerRoleRemoteId,
          });

          if (!createdAssignmentResult.success) {
            return createdAssignmentResult;
          }
        }
      }

      if (!ownerRoleModel) {
        return {
          success: false,
          error: UserManagementUnknownError,
        };
      }

      return {
        success: true,
        value: mapRoleModelToDomain(ownerRoleModel, ownerPermissionCodes),
      };
    },

    async getPermissionCodesByAccountUser(
      payload: ResolveAccountPermissionCodesPayload,
    ): Promise<AccountPermissionCodesResult> {
      const normalizedAccountRemoteId = normalizeRequired(payload.accountRemoteId);
      const normalizedUserRemoteId = normalizeRequired(payload.userRemoteId);

      if (!normalizedAccountRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("Account remote id is required."),
        };
      }

      if (!normalizedUserRemoteId) {
        return {
          success: false,
          error: UserManagementValidationError("User remote id is required."),
        };
      }

      const ownerUserResult = await getOwnerUserRemoteIdResult(normalizedAccountRemoteId);

      if (!ownerUserResult.success) {
        return ownerUserResult;
      }

      const ownerUserRemoteId = ownerUserResult.value;
      const isOwner = normalizedUserRemoteId === ownerUserRemoteId;

      if (!isOwner) {
        const memberResult = await repository.getAccountMemberByAccountAndUser(
          normalizedAccountRemoteId,
          normalizedUserRemoteId,
        );

        if (!memberResult.success) {
          return {
            success: false,
            error: UserManagementForbiddenError(
              "This user does not have access to the selected account.",
            ),
          };
        }

        if (memberResult.value.status !== AccountMemberStatus.Active) {
          return {
            success: false,
            error: UserManagementForbiddenError(
              "This user is inactive and cannot access this account.",
            ),
          };
        }
      } else {
        const ensureOwnerResult = await repository.ensureDefaultOwnerRoleForAccountUser({
          accountRemoteId: normalizedAccountRemoteId,
          userRemoteId: normalizedUserRemoteId,
        });

        if (!ensureOwnerResult.success) {
          return ensureOwnerResult;
        }
      }

      const assignmentResult = await localDatasource.getUserRoleAssignment(
        normalizedAccountRemoteId,
        normalizedUserRemoteId,
      );

      if (!assignmentResult.success) {
        return {
          success: false,
          error: mapUserManagementError(assignmentResult.error),
        };
      }

      if (!assignmentResult.value) {
        return {
          success: false,
          error: UserManagementForbiddenError(
            "No role assignment found for this account user.",
          ),
        };
      }

      const assignedRoleResult = await localDatasource.getRoleByRemoteId(
        assignmentResult.value.roleRemoteId,
      );

      if (!assignedRoleResult.success) {
        return {
          success: false,
          error: mapUserManagementError(assignedRoleResult.error),
        };
      }

      if (
        !assignedRoleResult.value ||
        assignedRoleResult.value.accountRemoteId !== normalizedAccountRemoteId
      ) {
        return {
          success: false,
          error: UserManagementForbiddenError(
            "Assigned role is invalid for this account user.",
          ),
        };
      }

      const rolePermissionsResult = await localDatasource.getRolePermissionsByRoleRemoteIds([
        assignmentResult.value.roleRemoteId,
      ]);

      if (!rolePermissionsResult.success) {
        return {
          success: false,
          error: mapUserManagementError(rolePermissionsResult.error),
        };
      }

      return {
        success: true,
        value: normalizePermissionCodes(
          rolePermissionsResult.value.map((rolePermission) => rolePermission.permissionCode),
        ),
      };
    },
  };

  return repository;
};
