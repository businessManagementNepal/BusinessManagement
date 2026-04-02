import { describe, expect, it, vi } from "vitest";
import { AuthCredentialRepository } from "@/feature/session/data/repository/authCredential.repository";
import {
  AuthSessionErrorType,
  CredentialType,
} from "@/feature/session/types/authSession.types";
import { GetAuthUserByRemoteIdUseCase } from "@/feature/session/useCase/getAuthUserByRemoteId.useCase";
import { UserManagementRepository } from "@/feature/setting/accounts/userManagement/data/repository/userManagement.repository";
import { createUpdateAccountMemberUseCase } from "@/feature/setting/accounts/userManagement/useCase/updateAccountMember.useCase.impl";
import {
  AccountMemberStatus,
  UserManagementErrorType,
} from "@/feature/setting/accounts/userManagement/types/userManagement.types";

describe("updateAccountMember.useCase", () => {
  it("blocks update when actor lacks manage-staff permission", async () => {
    const userManagementRepository = {
      getPermissionCodesByAccountUser: vi.fn(async () => ({
        success: true as const,
        value: ["user_management.view"],
      })),
      getAccountMemberByRemoteId: vi.fn(async () => {
        throw new Error("should not be called");
      }),
    } as unknown as UserManagementRepository;

    const getAuthUserByRemoteIdUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
    } as unknown as GetAuthUserByRemoteIdUseCase;

    const authCredentialRepository = {
      getAuthCredentialByUserRemoteId: vi.fn(async () => {
        throw new Error("should not be called");
      }),
    } as unknown as AuthCredentialRepository;

    const passwordHashService = {
      generateSalt: vi.fn(async () => "salt"),
      hash: vi.fn(async () => "hash"),
      compare: vi.fn(async () => true),
      needsRehash: vi.fn(() => false),
    };

    const useCase = createUpdateAccountMemberUseCase({
      userManagementRepository,
      getAuthUserByRemoteIdUseCase,
      authCredentialRepository,
      passwordHashService: passwordHashService as any,
    });

    const result = await useCase.execute({
      accountRemoteId: "account-1",
      actorUserRemoteId: "staff-1",
      memberRemoteId: "member-1",
      fullName: "Staff User",
    });

    expect(result.success).toBe(false);
    expect(userManagementRepository.getAccountMemberByRemoteId).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.type).toBe(UserManagementErrorType.Forbidden);
    }
  });

  it("updates profile without role reassignment when role remains unchanged", async () => {
    const userManagementRepository = {
      getPermissionCodesByAccountUser: vi.fn(async () => ({
        success: true as const,
        value: ["user_management.manage_staff"],
      })),
      getAccountMemberByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "member-1",
          accountRemoteId: "account-1",
          userRemoteId: "staff-1",
          status: AccountMemberStatus.Active,
          invitedByUserRemoteId: "owner-1",
          joinedAt: 1,
          lastActiveAt: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
      getUserRoleAssignment: vi.fn(async () => ({
        success: true as const,
        value: {
          accountRemoteId: "account-1",
          userRemoteId: "staff-1",
          roleRemoteId: "role-staff",
          createdAt: 1,
          updatedAt: 1,
        },
      })),
      updateMemberAccessTransaction: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
      getAccountMembersWithRoleByAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "member-1",
            accountRemoteId: "account-1",
            userRemoteId: "staff-1",
            status: AccountMemberStatus.Active,
            invitedByUserRemoteId: "owner-1",
            joinedAt: 1,
            lastActiveAt: 1,
            createdAt: 1,
            updatedAt: 2,
            fullName: "Updated Name",
            email: "staff@elekha.com",
            phone: "+9779800000000",
            roleRemoteId: "role-staff",
            roleName: "Staff",
            isAccountOwner: false,
          },
        ],
      })),
    } as unknown as UserManagementRepository;

    const getAuthUserByRemoteIdUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "staff-1",
          fullName: "Staff User",
          email: "staff@elekha.com",
          phone: "+9779800000000",
          authProvider: null,
          profileImageUrl: null,
          preferredLanguage: null,
          isEmailVerified: false,
          isPhoneVerified: false,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    } as unknown as GetAuthUserByRemoteIdUseCase;

    const authCredentialRepository = {
      getAuthCredentialByUserRemoteId: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "cred-1",
          userRemoteId: "staff-1",
          loginId: "+9779800000000",
          credentialType: CredentialType.Password,
          passwordHash: "hash",
          passwordSalt: "salt",
          hint: null,
          lastLoginAt: null,
          isActive: true,
          failedAttemptCount: 0,
          lockoutUntil: null,
          lastFailedLoginAt: null,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
      getAuthCredentialByLoginId: vi.fn(async () => ({
        success: false as const,
        error: {
          type: AuthSessionErrorType.AuthCredentialNotFound,
          message: "not found",
        },
      })),
    } as unknown as AuthCredentialRepository;

    const passwordHashService = {
      generateSalt: vi.fn(async () => "salt"),
      hash: vi.fn(async () => "hash"),
      compare: vi.fn(async () => true),
      needsRehash: vi.fn(() => false),
    };

    const useCase = createUpdateAccountMemberUseCase({
      userManagementRepository,
      getAuthUserByRemoteIdUseCase,
      authCredentialRepository,
      passwordHashService: passwordHashService as any,
    });

    const result = await useCase.execute({
      accountRemoteId: "account-1",
      actorUserRemoteId: "manager-1",
      memberRemoteId: "member-1",
      fullName: "Updated Name",
      roleRemoteId: "role-staff",
    });

    expect(result.success).toBe(true);
    expect(userManagementRepository.updateMemberAccessTransaction).toHaveBeenCalledTimes(1);
    expect(userManagementRepository.updateMemberAccessTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        roleAssignment: null,
      }),
    );
  });

  it("blocks role reassignment when actor lacks assign-role permission", async () => {
    const userManagementRepository = {
      getPermissionCodesByAccountUser: vi.fn(async () => ({
        success: true as const,
        value: ["user_management.manage_staff"],
      })),
      getAccountMemberByRemoteId: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "member-1",
          accountRemoteId: "account-1",
          userRemoteId: "staff-1",
          status: AccountMemberStatus.Active,
          invitedByUserRemoteId: "owner-1",
          joinedAt: 1,
          lastActiveAt: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
      getUserRoleAssignment: vi.fn(async () => ({
        success: true as const,
        value: {
          accountRemoteId: "account-1",
          userRemoteId: "staff-1",
          roleRemoteId: "role-old",
          createdAt: 1,
          updatedAt: 1,
        },
      })),
      updateMemberAccessTransaction: vi.fn(async () => {
        throw new Error("should not be called");
      }),
    } as unknown as UserManagementRepository;

    const getAuthUserByRemoteIdUseCase = {
      execute: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "staff-1",
          fullName: "Staff User",
          email: "staff@elekha.com",
          phone: "+9779800000000",
          authProvider: null,
          profileImageUrl: null,
          preferredLanguage: null,
          isEmailVerified: false,
          isPhoneVerified: false,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
    } as unknown as GetAuthUserByRemoteIdUseCase;

    const authCredentialRepository = {
      getAuthCredentialByUserRemoteId: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "cred-1",
          userRemoteId: "staff-1",
          loginId: "+9779800000000",
          credentialType: CredentialType.Password,
          passwordHash: "hash",
          passwordSalt: "salt",
          hint: null,
          lastLoginAt: null,
          isActive: true,
          failedAttemptCount: 0,
          lockoutUntil: null,
          lastFailedLoginAt: null,
          createdAt: 1,
          updatedAt: 1,
        },
      })),
      getAuthCredentialByLoginId: vi.fn(async () => ({
        success: false as const,
        error: {
          type: AuthSessionErrorType.AuthCredentialNotFound,
          message: "not found",
        },
      })),
    } as unknown as AuthCredentialRepository;

    const passwordHashService = {
      generateSalt: vi.fn(async () => "salt"),
      hash: vi.fn(async () => "hash"),
      compare: vi.fn(async () => true),
      needsRehash: vi.fn(() => false),
    };

    const useCase = createUpdateAccountMemberUseCase({
      userManagementRepository,
      getAuthUserByRemoteIdUseCase,
      authCredentialRepository,
      passwordHashService: passwordHashService as any,
    });

    const result = await useCase.execute({
      accountRemoteId: "account-1",
      actorUserRemoteId: "manager-1",
      memberRemoteId: "member-1",
      roleRemoteId: "role-new",
    });

    expect(result.success).toBe(false);
    expect(userManagementRepository.updateMemberAccessTransaction).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.type).toBe(UserManagementErrorType.Forbidden);
    }
  });
});
