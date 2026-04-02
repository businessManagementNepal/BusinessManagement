import { describe, expect, it, vi } from "vitest";
import { createUserManagementRepository } from "@/feature/setting/accounts/userManagement/data/repository/userManagement.repository.impl";
import { AccountMemberStatus, UserManagementErrorType } from "@/feature/setting/accounts/userManagement/types/userManagement.types";

const createLocalDatasourceStub = (): any => ({
  ensurePermissionCatalogSeeded: vi.fn(async () => ({ success: true as const, value: true })),
  getPermissionCatalog: vi.fn(async () => ({ success: true as const, value: [] })),
  getRoleByRemoteId: vi.fn(async () => ({ success: true as const, value: null })),
  getRolesByAccountRemoteId: vi.fn(async () => ({ success: true as const, value: [] })),
  getMemberByRemoteId: vi.fn(async () => ({ success: true as const, value: null })),
  getMembersByAccountRemoteId: vi.fn(async () => ({ success: true as const, value: [] })),
  getMemberByAccountAndUser: vi.fn(async () => ({ success: true as const, value: null })),
  createMemberAccessRecord: vi.fn(async () => ({ success: true as const, value: true })),
  updateMemberAccessRecord: vi.fn(async () => ({ success: true as const, value: true })),
  saveMember: vi.fn(async () => ({ success: true as const, value: { remoteId: "member-1" } })),
  deleteMemberByRemoteId: vi.fn(async () => ({ success: true as const, value: true })),
  getActiveMemberAccountRemoteIdsByUserRemoteId: vi.fn(async () => ({
    success: true as const,
    value: [],
  })),
  saveRole: vi.fn(async () => ({ success: true as const, value: {} })),
  deleteRoleByRemoteId: vi.fn(async () => ({ success: true as const, value: true })),
  deleteRolePermissionsByRoleRemoteId: vi.fn(async () => ({
    success: true as const,
    value: true,
  })),
  replaceRolePermissions: vi.fn(async () => ({ success: true as const, value: true })),
  getRolePermissionsByRoleRemoteIds: vi.fn(async () => ({
    success: true as const,
    value: [],
  })),
  assignUserRole: vi.fn(async () => ({
    success: true as const,
    value: {
      accountRemoteId: "account-1",
      userRemoteId: "user-1",
      roleRemoteId: "role-1",
      createdAt: new Date(1),
      updatedAt: new Date(1),
    },
  })),
  getUserRoleAssignment: vi.fn(async () => ({ success: true as const, value: null })),
  getUserRoleAssignmentsByAccountRemoteId: vi.fn(async () => ({
    success: true as const,
    value: [],
  })),
  deleteUserRoleAssignment: vi.fn(async () => ({ success: true as const, value: true })),
  deleteUserRoleAssignmentsByRoleRemoteId: vi.fn(async () => ({
    success: true as const,
    value: true,
  })),
});

describe("userManagement.repository guardrails", () => {
  it("rejects assigning owner role to non-owner users", async () => {
    const localDatasource = createLocalDatasourceStub();
    const accountRepository = {
      getAccountByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { ownerUserRemoteId: "owner-1" },
      })),
    };
    const authUserRepository = {
      getAllAuthUsers: vi.fn(async () => ({ success: true as const, value: [] })),
      getAuthUserByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { remoteId: "staff-1" },
      })),
    };

    const repository = createUserManagementRepository({
      localDatasource: localDatasource as any,
      accountRepository: accountRepository as any,
      authUserRepository: authUserRepository as any,
    });

    const result = await repository.assignUserRole({
      accountRemoteId: "account-1",
      actorUserRemoteId: "owner-1",
      userRemoteId: "staff-1",
      roleRemoteId: "owner-account-1",
    });

    expect(result.success).toBe(false);
    expect(localDatasource.getRoleByRemoteId).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.type).toBe(UserManagementErrorType.Forbidden);
    }
  });

  it("rejects create-member transaction when role belongs to another account", async () => {
    const localDatasource = createLocalDatasourceStub();
    localDatasource.getRoleByRemoteId.mockResolvedValue({
      success: true as const,
      value: {
        remoteId: "role-2",
        accountRemoteId: "account-2",
      },
    });

    const accountRepository = {
      getAccountByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { ownerUserRemoteId: "owner-1" },
      })),
    };
    const authUserRepository = {
      getAllAuthUsers: vi.fn(async () => ({ success: true as const, value: [] })),
      getAuthUserByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { remoteId: "staff-1" },
      })),
    };

    const repository = createUserManagementRepository({
      localDatasource: localDatasource as any,
      accountRepository: accountRepository as any,
      authUserRepository: authUserRepository as any,
    });

    const result = await repository.createMemberAccessTransaction({
      authUser: {
        remoteId: "staff-1",
        fullName: "Staff",
        email: null,
        phone: "+9779800000000",
        authProvider: null,
        profileImageUrl: null,
        preferredLanguage: null,
        isEmailVerified: false,
        isPhoneVerified: false,
      },
      authCredential: {
        remoteId: "cred-1",
        userRemoteId: "staff-1",
        loginId: "+9779800000000",
        credentialType: "password",
        passwordHash: "hash",
        passwordSalt: "salt",
        hint: null,
        isActive: true,
      },
      member: {
        remoteId: "member-1",
        accountRemoteId: "account-1",
        userRemoteId: "staff-1",
        status: AccountMemberStatus.Active,
        invitedByUserRemoteId: "owner-1",
        joinedAt: 1,
        lastActiveAt: null,
      },
      roleRemoteId: "role-2",
    });

    expect(result.success).toBe(false);
    expect(localDatasource.createMemberAccessRecord).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.type).toBe(UserManagementErrorType.ValidationError);
    }
  });

  it("rejects update-member transaction when role-assignment user mismatches auth user", async () => {
    const localDatasource = createLocalDatasourceStub();
    const accountRepository = {
      getAccountByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { ownerUserRemoteId: "owner-1" },
      })),
    };
    const authUserRepository = {
      getAllAuthUsers: vi.fn(async () => ({ success: true as const, value: [] })),
      getAuthUserByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { remoteId: "staff-1" },
      })),
    };

    const repository = createUserManagementRepository({
      localDatasource: localDatasource as any,
      accountRepository: accountRepository as any,
      authUserRepository: authUserRepository as any,
    });

    const result = await repository.updateMemberAccessTransaction({
      authUser: {
        remoteId: "staff-1",
        fullName: "Staff",
        email: null,
        phone: "+9779800000000",
        authProvider: null,
        profileImageUrl: null,
        preferredLanguage: null,
        isEmailVerified: false,
        isPhoneVerified: false,
      },
      authCredential: {
        remoteId: "cred-1",
        userRemoteId: "staff-1",
        loginId: "+9779800000000",
        credentialType: "password",
        passwordHash: "hash",
        passwordSalt: "salt",
        hint: null,
        isActive: true,
      },
      roleAssignment: {
        accountRemoteId: "account-1",
        actorUserRemoteId: "owner-1",
        userRemoteId: "staff-2",
        roleRemoteId: "role-staff",
      },
    });

    expect(result.success).toBe(false);
    expect(localDatasource.updateMemberAccessRecord).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.type).toBe(UserManagementErrorType.ValidationError);
    }
  });

  it("fails closed when assignment references a role from another account", async () => {
    const localDatasource = createLocalDatasourceStub();
    localDatasource.getMemberByAccountAndUser.mockResolvedValue({
      success: true as const,
      value: {
        remoteId: "member-1",
        accountRemoteId: "account-1",
        userRemoteId: "staff-1",
        status: AccountMemberStatus.Active,
        invitedByUserRemoteId: "owner-1",
        joinedAt: 1,
        lastActiveAt: 1,
        createdAt: new Date(1),
        updatedAt: new Date(1),
      },
    });
    localDatasource.getUserRoleAssignment.mockResolvedValue({
      success: true as const,
      value: {
        accountRemoteId: "account-1",
        userRemoteId: "staff-1",
        roleRemoteId: "role-2",
      },
    });
    localDatasource.getRoleByRemoteId.mockResolvedValue({
      success: true as const,
      value: {
        remoteId: "role-2",
        accountRemoteId: "account-2",
      },
    });

    const accountRepository = {
      getAccountByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { ownerUserRemoteId: "owner-1" },
      })),
    };
    const authUserRepository = {
      getAllAuthUsers: vi.fn(async () => ({ success: true as const, value: [] })),
      getAuthUserByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { remoteId: "staff-1" },
      })),
    };

    const repository = createUserManagementRepository({
      localDatasource: localDatasource as any,
      accountRepository: accountRepository as any,
      authUserRepository: authUserRepository as any,
    });

    const result = await repository.getPermissionCodesByAccountUser({
      accountRemoteId: "account-1",
      userRemoteId: "staff-1",
    });

    expect(result.success).toBe(false);
    expect(localDatasource.getRolePermissionsByRoleRemoteIds).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.type).toBe(UserManagementErrorType.Forbidden);
    }
  });

  it("preserves existing inactive member status during role reassignment", async () => {
    const localDatasource = createLocalDatasourceStub();
    localDatasource.getRoleByRemoteId.mockResolvedValue({
      success: true as const,
      value: {
        remoteId: "role-staff",
        accountRemoteId: "account-1",
      },
    });
    localDatasource.getMemberByAccountAndUser.mockResolvedValue({
      success: true as const,
      value: {
        remoteId: "member-1",
        accountRemoteId: "account-1",
        userRemoteId: "staff-1",
        status: AccountMemberStatus.Inactive,
        invitedByUserRemoteId: "owner-1",
        joinedAt: 1,
        lastActiveAt: 1,
      },
    });

    const accountRepository = {
      getAccountByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { ownerUserRemoteId: "owner-1" },
      })),
    };
    const authUserRepository = {
      getAllAuthUsers: vi.fn(async () => ({ success: true as const, value: [] })),
      getAuthUserByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { remoteId: "staff-1" },
      })),
    };

    const repository = createUserManagementRepository({
      localDatasource: localDatasource as any,
      accountRepository: accountRepository as any,
      authUserRepository: authUserRepository as any,
    });

    const result = await repository.assignUserRole({
      accountRemoteId: "account-1",
      actorUserRemoteId: "owner-1",
      userRemoteId: "staff-1",
      roleRemoteId: "role-staff",
    });

    expect(result.success).toBe(true);
    expect(localDatasource.saveMember).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AccountMemberStatus.Inactive,
      }),
    );
  });

  it("deletes member access atomically through datasource deleteMemberByRemoteId", async () => {
    const localDatasource = createLocalDatasourceStub();
    localDatasource.getMemberByRemoteId.mockResolvedValue({
      success: true as const,
      value: {
        remoteId: "member-1",
        accountRemoteId: "account-1",
        userRemoteId: "staff-1",
        status: AccountMemberStatus.Active,
        invitedByUserRemoteId: "owner-1",
        joinedAt: 1,
        lastActiveAt: 1,
        createdAt: new Date(1),
        updatedAt: new Date(1),
      },
    });

    const accountRepository = {
      getAccountByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { ownerUserRemoteId: "owner-1" },
      })),
    };
    const authUserRepository = {
      getAllAuthUsers: vi.fn(async () => ({ success: true as const, value: [] })),
      getAuthUserByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { remoteId: "staff-1" },
      })),
    };

    const repository = createUserManagementRepository({
      localDatasource: localDatasource as any,
      accountRepository: accountRepository as any,
      authUserRepository: authUserRepository as any,
    });

    const result = await repository.deleteAccountMemberByRemoteId("member-1");

    expect(result.success).toBe(true);
    expect(localDatasource.deleteMemberByRemoteId).toHaveBeenCalledTimes(1);
    expect(localDatasource.deleteUserRoleAssignment).not.toHaveBeenCalled();
  });

  it("deletes role atomically through datasource deleteRoleByRemoteId", async () => {
    const localDatasource = createLocalDatasourceStub();
    localDatasource.getRoleByRemoteId.mockResolvedValue({
      success: true as const,
      value: {
        remoteId: "role-1",
        accountRemoteId: "account-1",
        isSystem: false,
        isDefault: false,
      },
    });
    localDatasource.getUserRoleAssignmentsByAccountRemoteId.mockResolvedValue({
      success: true as const,
      value: [],
    });

    const accountRepository = {
      getAccountByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { ownerUserRemoteId: "owner-1" },
      })),
    };
    const authUserRepository = {
      getAllAuthUsers: vi.fn(async () => ({ success: true as const, value: [] })),
      getAuthUserByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: { remoteId: "staff-1" },
      })),
    };

    const repository = createUserManagementRepository({
      localDatasource: localDatasource as any,
      accountRepository: accountRepository as any,
      authUserRepository: authUserRepository as any,
    });

    const result = await repository.deleteRoleByRemoteId("role-1");

    expect(result.success).toBe(true);
    expect(localDatasource.deleteRoleByRemoteId).toHaveBeenCalledTimes(1);
    expect(localDatasource.deleteRolePermissionsByRoleRemoteId).not.toHaveBeenCalled();
    expect(localDatasource.deleteUserRoleAssignmentsByRoleRemoteId).not.toHaveBeenCalled();
  });
});
