import { describe, expect, it, vi } from "vitest";
import { createSaveUserManagementRoleUseCase } from "@/feature/userManagement/useCase/saveUserManagementRole.useCase.impl";
import { UserManagementRepository } from "@/feature/userManagement/data/repository/userManagement.repository";
import { UserManagementRole } from "@/feature/userManagement/types/userManagement.types";

const buildRole = (
  overrides: Partial<UserManagementRole> = {},
): UserManagementRole => ({
  remoteId: "role-1",
  accountRemoteId: "account-1",
  name: "Manager",
  isSystem: false,
  isDefault: false,
  permissionCodes: ["user_management.manage_staff"],
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const createRepository = (
  saveRoleMock: UserManagementRepository["saveRole"],
): UserManagementRepository => ({
  ensurePermissionCatalogSeeded: vi.fn(async () => ({
    success: true as const,
    value: true,
  })),
  getPermissionCatalog: vi.fn(async () => ({
    success: true as const,
    value: [],
  })),
  getPermissionByCode: vi.fn(async () => ({
    success: false as const,
    error: { type: "NOT_FOUND" as const, message: "Not found" },
  })),
  getRolesByAccountRemoteId: vi.fn(async () => ({
    success: true as const,
    value: [],
  })),
  getAccountOwnerUserRemoteId: vi.fn(async () => ({
    success: true as const,
    value: "owner-1",
  })),
  getAccountMemberByRemoteId: vi.fn(async () => ({
    success: false as const,
    error: { type: "NOT_FOUND" as const, message: "Not found" },
  })),
  getAccountMemberByAccountAndUser: vi.fn(async () => ({
    success: false as const,
    error: { type: "NOT_FOUND" as const, message: "Not found" },
  })),
  getAccountMembersByAccountRemoteId: vi.fn(async () => ({
    success: true as const,
    value: [],
  })),
  getAccountMembersWithRoleByAccountRemoteId: vi.fn(async () => ({
    success: true as const,
    value: [],
  })),
  saveAccountMember: vi.fn(async () => ({
    success: false as const,
    error: { type: "UNKNOWN_ERROR" as const, message: "Unused" },
  })),
  createMemberAccessTransaction: vi.fn(async () => ({
    success: false as const,
    error: { type: "UNKNOWN_ERROR" as const, message: "Unused" },
  })),
  updateMemberAccessTransaction: vi.fn(async () => ({
    success: false as const,
    error: { type: "UNKNOWN_ERROR" as const, message: "Unused" },
  })),
  deleteAccountMemberByRemoteId: vi.fn(async () => ({
    success: true as const,
    value: true,
  })),
  getActiveMemberAccountRemoteIdsByUserRemoteId: vi.fn(async () => ({
    success: true as const,
    value: [],
  })),
  saveRole: saveRoleMock,
  deleteRoleByRemoteId: vi.fn(async () => ({
    success: true as const,
    value: true,
  })),
  assignUserRole: vi.fn(async () => ({
    success: false as const,
    error: { type: "UNKNOWN_ERROR" as const, message: "Unused" },
  })),
  getUserRoleAssignment: vi.fn(async () => ({
    success: false as const,
    error: { type: "NOT_FOUND" as const, message: "Not found" },
  })),
  ensureDefaultOwnerRoleForAccountUser: vi.fn(async () => ({
    success: true as const,
    value: buildRole(),
  })),
  getPermissionCodesByAccountUser: vi.fn(async () => ({
    success: true as const,
    value: ["user_management.manage_roles"],
  })),
});

describe("saveUserManagementRole.useCase", () => {
  it("rejects blank role name after trimming", async () => {
    const saveRoleMock = vi.fn<UserManagementRepository["saveRole"]>(
      async () => ({
        success: true as const,
        value: buildRole(),
      }),
    );

    const repository = createRepository(saveRoleMock);
    const useCase = createSaveUserManagementRoleUseCase(repository);

    const result = await useCase.execute({
      remoteId: null,
      accountRemoteId: "account-1",
      actorUserRemoteId: "user-1",
      name: " ",
      permissionCodes: [],
      isSystem: null,
      isDefault: null,
    });

    expect(result.success).toBe(false);
    expect(saveRoleMock).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.message).toBe(
        "Role name must be at least 2 characters.",
      );
    }
  });

  it("normalizes name and permission codes before saving", async () => {
    const saveRoleMock = vi.fn<UserManagementRepository["saveRole"]>(
      async (payload) => ({
        success: true as const,
        value: buildRole({
          remoteId: payload.remoteId ?? "role-1",
          accountRemoteId: payload.accountRemoteId,
          name: payload.name,
          permissionCodes: payload.permissionCodes,
          isSystem: payload.isSystem ?? false,
          isDefault: payload.isDefault ?? false,
        }),
      }),
    );

    const repository = createRepository(saveRoleMock);
    const useCase = createSaveUserManagementRoleUseCase(repository);

    const result = await useCase.execute({
      remoteId: null,
      accountRemoteId: "account-1",
      actorUserRemoteId: "user-1",
      name: "  Manager  ",
      permissionCodes: [
        " user_management.manage_staff ",
        "user_management.manage_staff",
        " user_management.assign_role ",
      ],
      isSystem: null,
      isDefault: null,
    });

    expect(result.success).toBe(true);
    expect(saveRoleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Manager",
        permissionCodes: [
          "user_management.assign_role",
          "user_management.manage_staff",
        ],
      }),
    );
  });
});
