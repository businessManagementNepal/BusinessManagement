import { describe, expect, it, vi } from "vitest";
import { AuthCredentialRepository } from "@/feature/session/data/repository/authCredential.repository";
import {
  AuthSessionErrorType,
  CredentialType,
} from "@/feature/session/types/authSession.types";
import { createCreateAccountMemberUseCase } from "@/feature/setting/accounts/userManagement/useCase/createAccountMember.useCase.impl";
import {
  AccountMemberStatus,
  UserManagementErrorType,
  UserManagementForbiddenError,
} from "@/feature/setting/accounts/userManagement/types/userManagement.types";

vi.mock("expo-crypto", () => ({
  randomUUID: () => "mocked-uuid",
}));

describe("createAccountMember.useCase", () => {
  it("creates a staff member when actor has required permissions", async () => {
    const userManagementRepository = {
      getPermissionCodesByAccountUser: vi.fn(async () => ({
        success: true as const,
        value: ["user_management.manage_staff", "user_management.assign_role"],
      })),
      createMemberAccessTransaction: vi.fn(async () => ({
        success: true as const,
        value: true,
      })),
      getAccountMembersWithRoleByAccountRemoteId: vi.fn(async () => ({
        success: true as const,
        value: [
          {
            remoteId: "member-1",
            accountRemoteId: "account-1",
            userRemoteId: "mocked-uuid",
            status: AccountMemberStatus.Active,
            invitedByUserRemoteId: "owner-1",
            joinedAt: 1,
            lastActiveAt: null,
            createdAt: 1,
            updatedAt: 1,
            fullName: "Staff User",
            email: "staff@elekha.com",
            phone: "+9779800000000",
            roleRemoteId: "role-staff",
            roleName: "Staff",
            isAccountOwner: false,
          },
        ],
      })),
    } as any;

    const authCredentialRepository = {
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

    const useCase = createCreateAccountMemberUseCase({
      userManagementRepository,
      authCredentialRepository,
      passwordHashService: passwordHashService as any,
    });

    const result = await useCase.execute({
      accountRemoteId: "account-1",
      actorUserRemoteId: "owner-1",
      fullName: "Staff User",
      email: "staff@elekha.com",
      phoneCountryCode: "NP",
      phone: "9800000000",
      password: "password123",
      roleRemoteId: "role-staff",
    });

    expect(result.success).toBe(true);
    expect(authCredentialRepository.getAuthCredentialByLoginId).toHaveBeenCalledWith(
      "+9779800000000",
      CredentialType.Password,
    );
    expect(passwordHashService.generateSalt).toHaveBeenCalledTimes(1);
    expect(passwordHashService.hash).toHaveBeenCalledWith("password123", "salt");
    expect(userManagementRepository.createMemberAccessTransaction).toHaveBeenCalledTimes(1);
  });

  it("blocks create when actor lacks assign-role permission", async () => {
    const userManagementRepository = {
      getPermissionCodesByAccountUser: vi.fn(async () => ({
        success: true as const,
        value: ["user_management.manage_staff"],
      })),
      createMemberAccessTransaction: vi.fn(async () => {
        throw new Error("should not be called");
      }),
      getAccountMembersWithRoleByAccountRemoteId: vi.fn(async () => {
        throw new Error("should not be called");
      }),
    } as any;

    const authCredentialRepository = {
      getAuthCredentialByLoginId: vi.fn(async () => {
        throw new Error("should not be called");
      }),
    } as unknown as AuthCredentialRepository;

    const passwordHashService = {
      generateSalt: vi.fn(async () => "salt"),
      hash: vi.fn(async () => "hash"),
      compare: vi.fn(async () => true),
      needsRehash: vi.fn(() => false),
    };

    const useCase = createCreateAccountMemberUseCase({
      userManagementRepository,
      authCredentialRepository,
      passwordHashService: passwordHashService as any,
    });

    const result = await useCase.execute({
      accountRemoteId: "account-1",
      actorUserRemoteId: "staff-1",
      fullName: "Staff User",
      email: null,
      phoneCountryCode: "NP",
      phone: "9800000000",
      password: "password123",
      roleRemoteId: "role-staff",
    });

    expect(result.success).toBe(false);
    expect(authCredentialRepository.getAuthCredentialByLoginId).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.type).toBe(UserManagementErrorType.Forbidden);
    }
  });

  it("returns conflict when phone already has an auth credential", async () => {
    const userManagementRepository = {
      getPermissionCodesByAccountUser: vi.fn(async () => ({
        success: true as const,
        value: ["user_management.manage_staff", "user_management.assign_role"],
      })),
      createMemberAccessTransaction: vi.fn(async () => {
        throw new Error("should not be called");
      }),
      getAccountMembersWithRoleByAccountRemoteId: vi.fn(async () => {
        throw new Error("should not be called");
      }),
    } as any;

    const authCredentialRepository = {
      getAuthCredentialByLoginId: vi.fn(async () => ({
        success: true as const,
        value: {
          remoteId: "cred-1",
          userRemoteId: "user-1",
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
    } as unknown as AuthCredentialRepository;

    const passwordHashService = {
      generateSalt: vi.fn(async () => "salt"),
      hash: vi.fn(async () => "hash"),
      compare: vi.fn(async () => true),
      needsRehash: vi.fn(() => false),
    };

    const useCase = createCreateAccountMemberUseCase({
      userManagementRepository,
      authCredentialRepository,
      passwordHashService: passwordHashService as any,
    });

    const result = await useCase.execute({
      accountRemoteId: "account-1",
      actorUserRemoteId: "owner-1",
      fullName: "Staff User",
      email: "staff@elekha.com",
      phoneCountryCode: "NP",
      phone: "9800000000",
      password: "password123",
      roleRemoteId: "role-staff",
    });

    expect(result.success).toBe(false);
    expect(userManagementRepository.createMemberAccessTransaction).not.toHaveBeenCalled();

    if (!result.success) {
      expect(result.error.type).toBe(UserManagementErrorType.Conflict);
    }
  });

  it("returns repository errors from member creation transaction", async () => {
    const userManagementRepository = {
      getPermissionCodesByAccountUser: vi.fn(async () => ({
        success: true as const,
        value: ["user_management.manage_staff", "user_management.assign_role"],
      })),
      createMemberAccessTransaction: vi.fn(async () => ({
        success: false as const,
        error: UserManagementForbiddenError("Role cannot be assigned."),
      })),
      getAccountMembersWithRoleByAccountRemoteId: vi.fn(async () => {
        throw new Error("should not be called");
      }),
    } as any;

    const authCredentialRepository = {
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

    const useCase = createCreateAccountMemberUseCase({
      userManagementRepository,
      authCredentialRepository,
      passwordHashService: passwordHashService as any,
    });

    const result = await useCase.execute({
      accountRemoteId: "account-1",
      actorUserRemoteId: "owner-1",
      fullName: "Staff User",
      email: "staff@elekha.com",
      phoneCountryCode: "NP",
      phone: "9800000000",
      password: "password123",
      roleRemoteId: "owner-account-1",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.type).toBe(UserManagementErrorType.Forbidden);
    }
  });
});
