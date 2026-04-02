import { describe, expect, it, vi } from "vitest";
import { UserManagementRepository } from "@/feature/setting/accounts/userManagement/data/repository/userManagement.repository";
import { createAssignUserManagementRoleUseCase } from "@/feature/setting/accounts/userManagement/useCase/assignUserManagementRole.useCase.impl";
import { UserManagementErrorType } from "@/feature/setting/accounts/userManagement/types/userManagement.types";

describe("assignUserManagementRole.useCase", () => {
  it("requires actor user context", async () => {
    const repository = {
      getPermissionCodesByAccountUser: vi.fn(async () => ({
        success: true as const,
        value: ["user_management.assign_role"],
      })),
      assignUserRole: vi.fn(async () => ({
        success: true as const,
        value: {
          accountRemoteId: "account-1",
          userRemoteId: "staff-1",
          roleRemoteId: "role-staff",
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    } as unknown as UserManagementRepository;

    const useCase = createAssignUserManagementRoleUseCase(repository);
    const result = await useCase.execute({
      accountRemoteId: "account-1",
      userRemoteId: "staff-1",
      roleRemoteId: "role-staff",
    });

    expect(result.success).toBe(false);
    expect(repository.getPermissionCodesByAccountUser).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.type).toBe(UserManagementErrorType.ValidationError);
    }
  });

  it("blocks assignment when actor lacks assign-role permission", async () => {
    const repository = {
      getPermissionCodesByAccountUser: vi.fn(async () => ({
        success: true as const,
        value: ["user_management.manage_staff"],
      })),
      assignUserRole: vi.fn(async () => {
        throw new Error("should not be called");
      }),
    } as unknown as UserManagementRepository;

    const useCase = createAssignUserManagementRoleUseCase(repository);
    const result = await useCase.execute({
      accountRemoteId: "account-1",
      actorUserRemoteId: "manager-1",
      userRemoteId: "staff-1",
      roleRemoteId: "role-staff",
    });

    expect(result.success).toBe(false);
    expect(repository.assignUserRole).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.type).toBe(UserManagementErrorType.Forbidden);
    }
  });

  it("assigns role when actor has assign-role permission", async () => {
    const repository = {
      getPermissionCodesByAccountUser: vi.fn(async () => ({
        success: true as const,
        value: ["user_management.assign_role"],
      })),
      assignUserRole: vi.fn(async () => ({
        success: true as const,
        value: {
          accountRemoteId: "account-1",
          userRemoteId: "staff-1",
          roleRemoteId: "role-staff",
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    } as unknown as UserManagementRepository;

    const useCase = createAssignUserManagementRoleUseCase(repository);
    const result = await useCase.execute({
      accountRemoteId: "account-1",
      actorUserRemoteId: "owner-1",
      userRemoteId: "staff-1",
      roleRemoteId: "role-staff",
    });

    expect(result.success).toBe(true);
    expect(repository.assignUserRole).toHaveBeenCalledWith({
      accountRemoteId: "account-1",
      actorUserRemoteId: "owner-1",
      userRemoteId: "staff-1",
      roleRemoteId: "role-staff",
    });
  });
});
