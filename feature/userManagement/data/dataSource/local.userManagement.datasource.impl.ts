import { Database, Q } from "@nozbe/watermelondb";
import { Result } from "@/shared/types/result.types";
import {
  UserManagementDatasource,
  SaveAccountRoleRecordPayload,
  AssignAccountUserRoleRecordPayload,
  SaveAccountMemberRecordPayload,
  CreateMemberAccessRecordPayload,
  UpdateMemberAccessRecordPayload,
} from "./userManagement.datasource";
import { UserManagementPermissionSeed } from "../../types/userManagementPermissionSeed.types";
import { UserManagementPermissionModel } from "./db/userManagementPermission.model";
import { AccountRoleModel } from "./db/accountRole.model";
import { AccountMemberModel } from "./db/accountMember.model";
import { AccountRolePermissionModel } from "./db/accountRolePermission.model";
import { AccountUserRoleModel } from "./db/accountUserRole.model";
import { AuthUserModel } from "@/feature/session/data/dataSource/db/authUser.model";
import { AuthCredentialModel } from "@/feature/session/data/dataSource/db/authCredential.model";
import { RecordSyncStatus } from "@/feature/session/types/authSession.types";

const USER_MANAGEMENT_PERMISSIONS_TABLE = "user_management_permissions";
const ACCOUNT_ROLES_TABLE = "account_roles";
const ACCOUNT_MEMBERS_TABLE = "account_members";
const ACCOUNT_ROLE_PERMISSIONS_TABLE = "account_role_permissions";
const ACCOUNT_USER_ROLES_TABLE = "account_user_roles";
const AUTH_USERS_TABLE = "auth_users";
const AUTH_CREDENTIALS_TABLE = "auth_credentials";

type MutableRawTimestamps = {
  _raw: Record<"created_at" | "updated_at", number>;
};

const setCreatedAndUpdatedAt = (record: unknown, now: number): void => {
  (record as MutableRawTimestamps)._raw.created_at = now;
  (record as MutableRawTimestamps)._raw.updated_at = now;
};

const setUpdatedAt = (record: unknown, now: number): void => {
  (record as MutableRawTimestamps)._raw.updated_at = now;
};

const updateRoleSyncStatusOnMutation = (record: AccountRoleModel): void => {
  if (!record.recordSyncStatus) {
    record.recordSyncStatus = "pending_update";
    return;
  }

  if (
    record.recordSyncStatus === RecordSyncStatus.Synced ||
    record.recordSyncStatus === RecordSyncStatus.PendingDelete
  ) {
    record.recordSyncStatus = "pending_update";
  }
};

const updateMemberSyncStatusOnMutation = (record: AccountMemberModel): void => {
  if (!record.recordSyncStatus) {
    record.recordSyncStatus = "pending_update";
    return;
  }

  if (
    record.recordSyncStatus === RecordSyncStatus.Synced ||
    record.recordSyncStatus === RecordSyncStatus.PendingDelete
  ) {
    record.recordSyncStatus = "pending_update";
  }
};

const markRolePendingDelete = (record: AccountRoleModel): void => {
  record.recordSyncStatus = RecordSyncStatus.PendingDelete;
};

const markMemberPendingDelete = (record: AccountMemberModel): void => {
  record.recordSyncStatus = RecordSyncStatus.PendingDelete;
};

const selectLatestByTimestamps = <T extends { updatedAt: Date; createdAt: Date }>(
  records: readonly T[],
): T | null => {
  if (records.length === 0) {
    return null;
  }

  return [...records].sort((left, right) => {
    const updatedDiff = right.updatedAt.getTime() - left.updatedAt.getTime();
    if (updatedDiff !== 0) {
      return updatedDiff;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  })[0]!;
};

const getActiveRoleRecords = (
  roles: readonly AccountRoleModel[],
): AccountRoleModel[] => roles.filter((role) => role.deletedAt === null);

const getActiveMemberRecords = (
  members: readonly AccountMemberModel[],
): AccountMemberModel[] => members.filter((member) => member.deletedAt === null);

export const createLocalUserManagementDatasource = (
  database: Database,
): UserManagementDatasource => ({
  async ensurePermissionCatalogSeeded(
    seed: readonly UserManagementPermissionSeed[],
  ): Promise<Result<boolean>> {
    try {
      const permissionsCollection =
        database.get<UserManagementPermissionModel>(
          USER_MANAGEMENT_PERMISSIONS_TABLE,
        );
      const existingPermissions = await permissionsCollection.query().fetch();
      const existingByCode = new Map<string, UserManagementPermissionModel[]>();

      for (const existingPermission of existingPermissions) {
        const records = existingByCode.get(existingPermission.code) ?? [];
        records.push(existingPermission);
        existingByCode.set(existingPermission.code, records);
      }

      await database.write(async () => {
        const canonicalPermissionByCode = new Map<
          string,
          UserManagementPermissionModel
        >();

        for (const [permissionCode, permissionRecords] of existingByCode.entries()) {
          const canonicalPermission = selectLatestByTimestamps(permissionRecords);

          if (!canonicalPermission) {
            continue;
          }

          canonicalPermissionByCode.set(permissionCode, canonicalPermission);

          const duplicatePermissions = permissionRecords.filter(
            (permission) => permission.id !== canonicalPermission.id,
          );

          for (const duplicatePermission of duplicatePermissions) {
            await duplicatePermission.destroyPermanently();
          }
        }

        for (const permissionSeed of seed) {
          const existingPermission = canonicalPermissionByCode.get(
            permissionSeed.code,
          );

          if (existingPermission) {
            const hasChanged =
              existingPermission.module !== permissionSeed.module ||
              existingPermission.label !== permissionSeed.label ||
              existingPermission.description !== permissionSeed.description;

            if (!hasChanged) {
              continue;
            }

            await existingPermission.update((record) => {
              record.module = permissionSeed.module;
              record.label = permissionSeed.label;
              record.description = permissionSeed.description;
              setUpdatedAt(record, Date.now());
            });

            continue;
          }

          const createdPermission = await permissionsCollection.create((record) => {
            const now = Date.now();

            record.code = permissionSeed.code;
            record.module = permissionSeed.module;
            record.label = permissionSeed.label;
            record.description = permissionSeed.description;

            setCreatedAndUpdatedAt(record, now);
          });

          canonicalPermissionByCode.set(permissionSeed.code, createdPermission);
        }
      });

      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getPermissionCatalog(): Promise<Result<UserManagementPermissionModel[]>> {
    try {
      const permissionsCollection =
        database.get<UserManagementPermissionModel>(
          USER_MANAGEMENT_PERMISSIONS_TABLE,
        );

      const permissions = await permissionsCollection.query().fetch();
      const groupedByCode = new Map<string, UserManagementPermissionModel[]>();

      for (const permission of permissions) {
        const records = groupedByCode.get(permission.code) ?? [];
        records.push(permission);
        groupedByCode.set(permission.code, records);
      }

      const dedupedPermissions: UserManagementPermissionModel[] = [];

      for (const groupedPermissions of groupedByCode.values()) {
        const canonicalPermission = selectLatestByTimestamps(groupedPermissions);
        if (canonicalPermission) {
          dedupedPermissions.push(canonicalPermission);
        }
      }

      return {
        success: true,
        value: dedupedPermissions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getRoleByRemoteId(remoteId: string): Promise<Result<AccountRoleModel | null>> {
    try {
      const rolesCollection = database.get<AccountRoleModel>(ACCOUNT_ROLES_TABLE);

      const matchingRoles = await rolesCollection
        .query(Q.where("remote_id", remoteId))
        .fetch();
      const activeRoles = getActiveRoleRecords(matchingRoles);

      return {
        success: true,
        value: selectLatestByTimestamps(activeRoles),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getRolesByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<AccountRoleModel[]>> {
    try {
      const rolesCollection = database.get<AccountRoleModel>(ACCOUNT_ROLES_TABLE);

      const roles = await rolesCollection
        .query(Q.where("account_remote_id", accountRemoteId))
        .fetch();
      const activeRoles = getActiveRoleRecords(roles);
      const roleByRemoteId = new Map<string, AccountRoleModel>();

      for (const role of [...activeRoles].sort((left, right) => {
        return right.updatedAt.getTime() - left.updatedAt.getTime();
      })) {
        if (roleByRemoteId.has(role.remoteId)) {
          continue;
        }

        roleByRemoteId.set(role.remoteId, role);
      }

      return {
        success: true,
        value: [...roleByRemoteId.values()],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getMemberByRemoteId(
    remoteId: string,
  ): Promise<Result<AccountMemberModel | null>> {
    try {
      const membersCollection = database.get<AccountMemberModel>(ACCOUNT_MEMBERS_TABLE);
      const matchingMembers = await membersCollection
        .query(Q.where("remote_id", remoteId))
        .fetch();
      const activeMembers = getActiveMemberRecords(matchingMembers);

      return {
        success: true,
        value: selectLatestByTimestamps(activeMembers),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getMembersByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<AccountMemberModel[]>> {
    try {
      const membersCollection = database.get<AccountMemberModel>(ACCOUNT_MEMBERS_TABLE);
      const members = await membersCollection
        .query(Q.where("account_remote_id", accountRemoteId))
        .fetch();
      const activeMembers = getActiveMemberRecords(members);
      const memberByAccountAndUser = new Map<string, AccountMemberModel>();

      for (const member of [...activeMembers].sort((left, right) => {
        return right.updatedAt.getTime() - left.updatedAt.getTime();
      })) {
        const dedupeKey = `${member.accountRemoteId}:${member.userRemoteId}`;

        if (memberByAccountAndUser.has(dedupeKey)) {
          continue;
        }

        memberByAccountAndUser.set(dedupeKey, member);
      }

      return {
        success: true,
        value: [...memberByAccountAndUser.values()],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getMemberByAccountAndUser(
    accountRemoteId: string,
    userRemoteId: string,
  ): Promise<Result<AccountMemberModel | null>> {
    try {
      const membersCollection = database.get<AccountMemberModel>(ACCOUNT_MEMBERS_TABLE);
      const matchingMembers = await membersCollection
        .query(
          Q.where("account_remote_id", accountRemoteId),
          Q.where("user_remote_id", userRemoteId),
        )
        .fetch();
      const activeMembers = getActiveMemberRecords(matchingMembers);

      return {
        success: true,
        value: selectLatestByTimestamps(activeMembers),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async createMemberAccessRecord(
    payload: CreateMemberAccessRecordPayload,
  ): Promise<Result<boolean>> {
    try {
      const authUsersCollection = database.get<AuthUserModel>(AUTH_USERS_TABLE);
      const authCredentialsCollection = database.get<AuthCredentialModel>(AUTH_CREDENTIALS_TABLE);
      const membersCollection = database.get<AccountMemberModel>(ACCOUNT_MEMBERS_TABLE);
      const rolesCollection = database.get<AccountRoleModel>(ACCOUNT_ROLES_TABLE);
      const accountUserRolesCollection = database.get<AccountUserRoleModel>(
        ACCOUNT_USER_ROLES_TABLE,
      );

      await database.write(async () => {
        const existingUsers = await authUsersCollection
          .query(Q.where("remote_id", payload.authUser.remoteId))
          .fetch();
        if (existingUsers[0]) {
          throw new Error("Conflict: auth user already exists.");
        }

        const existingCredentialsByRemoteId = await authCredentialsCollection
          .query(Q.where("remote_id", payload.authCredential.remoteId))
          .fetch();
        if (existingCredentialsByRemoteId[0]) {
          throw new Error("Conflict: auth credential already exists.");
        }

        const existingCredentialsByLoginId = await authCredentialsCollection
          .query(
            Q.where("login_id", payload.authCredential.loginId),
            Q.where("credential_type", payload.authCredential.credentialType),
          )
          .fetch();
        if (existingCredentialsByLoginId[0]) {
          throw new Error("Conflict: auth credential login id already exists.");
        }

        const existingMembers = await membersCollection
          .query(Q.where("remote_id", payload.member.remoteId))
          .fetch();
        if (existingMembers[0]) {
          throw new Error("Conflict: account member already exists.");
        }

        const existingMemberByAccountAndUser = await membersCollection
          .query(
            Q.where("account_remote_id", payload.member.accountRemoteId),
            Q.where("user_remote_id", payload.member.userRemoteId),
          )
          .fetch();
        const activeMemberByAccountAndUser = getActiveMemberRecords(
          existingMemberByAccountAndUser,
        );

        if (activeMemberByAccountAndUser[0]) {
          throw new Error("Conflict: account member already exists for this user.");
        }

        const existingAssignments = await accountUserRolesCollection
          .query(
            Q.where("account_remote_id", payload.roleAssignment.accountRemoteId),
            Q.where("user_remote_id", payload.roleAssignment.userRemoteId),
          )
          .fetch();
        if (existingAssignments[0]) {
          throw new Error("Conflict: user role assignment already exists.");
        }

        const matchingRoles = await rolesCollection
          .query(Q.where("remote_id", payload.roleAssignment.roleRemoteId))
          .fetch();
        const matchingRole = selectLatestByTimestamps(getActiveRoleRecords(matchingRoles));

        if (!matchingRole) {
          throw new Error("Role not found.");
        }

        if (matchingRole.accountRemoteId !== payload.roleAssignment.accountRemoteId) {
          throw new Error("Validation: role does not belong to selected account.");
        }

        await authUsersCollection.create((record) => {
          const now = Date.now();
          record.remoteId = payload.authUser.remoteId;
          record.fullName = payload.authUser.fullName;
          record.email = payload.authUser.email;
          record.phone = payload.authUser.phone;
          record.authProvider = payload.authUser.authProvider;
          record.profileImageUrl = payload.authUser.profileImageUrl;
          record.preferredLanguage = payload.authUser.preferredLanguage;
          record.isEmailVerified = payload.authUser.isEmailVerified;
          record.isPhoneVerified = payload.authUser.isPhoneVerified;
          record.recordSyncStatus = RecordSyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;
          setCreatedAndUpdatedAt(record, now);
        });

        await authCredentialsCollection.create((record) => {
          const now = Date.now();
          record.remoteId = payload.authCredential.remoteId;
          record.userRemoteId = payload.authCredential.userRemoteId;
          record.loginId = payload.authCredential.loginId;
          record.credentialType = payload.authCredential.credentialType;
          record.passwordHash = payload.authCredential.passwordHash;
          record.passwordSalt = payload.authCredential.passwordSalt;
          record.hint = payload.authCredential.hint;
          record.lastLoginAt = null;
          record.isActive = payload.authCredential.isActive;
          record.failedAttemptCount = 0;
          record.lockoutUntil = null;
          record.lastFailedLoginAt = null;
          record.recordSyncStatus = RecordSyncStatus.PendingCreate;
          record.lastSyncedAt = null;
          record.deletedAt = null;
          setCreatedAndUpdatedAt(record, now);
        });

        await membersCollection.create((record) => {
          const now = Date.now();
          record.remoteId = payload.member.remoteId;
          record.accountRemoteId = payload.member.accountRemoteId;
          record.userRemoteId = payload.member.userRemoteId;
          record.status = payload.member.status;
          record.invitedByUserRemoteId = payload.member.invitedByUserRemoteId;
          record.joinedAt = payload.member.joinedAt;
          record.lastActiveAt = payload.member.lastActiveAt;
          record.recordSyncStatus = "pending_create";
          record.lastSyncedAt = null;
          record.deletedAt = null;
          setCreatedAndUpdatedAt(record, now);
        });

        await accountUserRolesCollection.create((record) => {
          const now = Date.now();
          record.accountRemoteId = payload.roleAssignment.accountRemoteId;
          record.userRemoteId = payload.roleAssignment.userRemoteId;
          record.roleRemoteId = payload.roleAssignment.roleRemoteId;
          setCreatedAndUpdatedAt(record, now);
        });
      });

      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async updateMemberAccessRecord(
    payload: UpdateMemberAccessRecordPayload,
  ): Promise<Result<boolean>> {
    try {
      const authUsersCollection = database.get<AuthUserModel>(AUTH_USERS_TABLE);
      const authCredentialsCollection = database.get<AuthCredentialModel>(AUTH_CREDENTIALS_TABLE);
      const rolesCollection = database.get<AccountRoleModel>(ACCOUNT_ROLES_TABLE);
      const accountUserRolesCollection = database.get<AccountUserRoleModel>(
        ACCOUNT_USER_ROLES_TABLE,
      );

      await database.write(async () => {
        const existingUsers = await authUsersCollection
          .query(Q.where("remote_id", payload.authUser.remoteId))
          .fetch();
        const existingUser = existingUsers[0];
        if (!existingUser) {
          throw new Error("Auth user not found.");
        }

        const existingCredentials = await authCredentialsCollection
          .query(Q.where("remote_id", payload.authCredential.remoteId))
          .fetch();
        const existingCredential = existingCredentials[0];
        if (!existingCredential) {
          throw new Error("Auth credential not found.");
        }

        if (
          payload.authCredential.loginId !== existingCredential.loginId ||
          payload.authCredential.credentialType !== existingCredential.credentialType
        ) {
          const credentialConflicts = await authCredentialsCollection
            .query(
              Q.where("login_id", payload.authCredential.loginId),
              Q.where("credential_type", payload.authCredential.credentialType),
            )
            .fetch();
          const conflictingCredential = credentialConflicts.find(
            (credential) => credential.remoteId !== existingCredential.remoteId,
          );
          if (conflictingCredential) {
            throw new Error("Conflict: auth credential login id already exists.");
          }
        }

        await existingUser.update((record) => {
          record.remoteId = payload.authUser.remoteId;
          record.fullName = payload.authUser.fullName;
          record.email = payload.authUser.email;
          record.phone = payload.authUser.phone;
          record.authProvider = payload.authUser.authProvider;
          record.profileImageUrl = payload.authUser.profileImageUrl;
          record.preferredLanguage = payload.authUser.preferredLanguage;
          record.isEmailVerified = payload.authUser.isEmailVerified;
          record.isPhoneVerified = payload.authUser.isPhoneVerified;
          if (!record.recordSyncStatus) {
            record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
          } else if (record.recordSyncStatus === RecordSyncStatus.Synced) {
            record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
          }
          setUpdatedAt(record, Date.now());
        });

        await existingCredential.update((record) => {
          record.remoteId = payload.authCredential.remoteId;
          record.userRemoteId = payload.authCredential.userRemoteId;
          record.loginId = payload.authCredential.loginId;
          record.credentialType = payload.authCredential.credentialType;
          record.passwordHash = payload.authCredential.passwordHash;
          record.passwordSalt = payload.authCredential.passwordSalt;
          record.hint = payload.authCredential.hint;
          record.isActive = payload.authCredential.isActive;
          if (!record.recordSyncStatus) {
            record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
          } else if (record.recordSyncStatus === RecordSyncStatus.Synced) {
            record.recordSyncStatus = RecordSyncStatus.PendingUpdate;
          }
          setUpdatedAt(record, Date.now());
        });

        if (payload.roleAssignment) {
          const matchingRoles = await rolesCollection
            .query(Q.where("remote_id", payload.roleAssignment.roleRemoteId))
            .fetch();
          const matchingRole = selectLatestByTimestamps(getActiveRoleRecords(matchingRoles));

          if (!matchingRole) {
            throw new Error("Role not found.");
          }

          if (matchingRole.accountRemoteId !== payload.roleAssignment.accountRemoteId) {
            throw new Error("Validation: role does not belong to selected account.");
          }

          const existingAssignments = await accountUserRolesCollection
            .query(
              Q.where("account_remote_id", payload.roleAssignment.accountRemoteId),
              Q.where("user_remote_id", payload.roleAssignment.userRemoteId),
            )
            .fetch();
          const existingAssignment = selectLatestByTimestamps(existingAssignments);
          const duplicateAssignments = existingAssignments.filter(
            (assignment) => assignment.id !== existingAssignment?.id,
          );

          if (existingAssignment) {
            await existingAssignment.update((record) => {
              record.roleRemoteId = payload.roleAssignment?.roleRemoteId ?? record.roleRemoteId;
              setUpdatedAt(record, Date.now());
            });

            for (const duplicateAssignment of duplicateAssignments) {
              await duplicateAssignment.destroyPermanently();
            }
          } else {
            await accountUserRolesCollection.create((record) => {
              const now = Date.now();
              record.accountRemoteId = payload.roleAssignment?.accountRemoteId ?? "";
              record.userRemoteId = payload.roleAssignment?.userRemoteId ?? "";
              record.roleRemoteId = payload.roleAssignment?.roleRemoteId ?? "";
              setCreatedAndUpdatedAt(record, now);
            });
          }
        }
      });

      return { success: true, value: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async saveMember(
    payload: SaveAccountMemberRecordPayload,
  ): Promise<Result<AccountMemberModel>> {
    try {
      const membersCollection = database.get<AccountMemberModel>(ACCOUNT_MEMBERS_TABLE);
      const membersByRemoteId = await membersCollection
        .query(Q.where("remote_id", payload.remoteId))
        .fetch();
      const membersByAccountAndUser = await membersCollection
        .query(
          Q.where("account_remote_id", payload.accountRemoteId),
          Q.where("user_remote_id", payload.userRemoteId),
        )
        .fetch();
      const activeMembersByAccountAndUser = getActiveMemberRecords(membersByAccountAndUser);
      const existingMemberByRemoteId = selectLatestByTimestamps(membersByRemoteId);
      const existingMemberByAccountAndUser = selectLatestByTimestamps(
        activeMembersByAccountAndUser,
      );
      const existingMember = existingMemberByRemoteId ?? existingMemberByAccountAndUser;

      if (existingMember) {
        await database.write(async () => {
          const now = Date.now();

          await existingMember.update((record) => {
            record.remoteId = payload.remoteId;
            record.accountRemoteId = payload.accountRemoteId;
            record.userRemoteId = payload.userRemoteId;
            record.status = payload.status;
            record.invitedByUserRemoteId = payload.invitedByUserRemoteId;
            record.joinedAt = payload.joinedAt;
            record.lastActiveAt = payload.lastActiveAt;
            record.deletedAt = null;
            updateMemberSyncStatusOnMutation(record);
            setUpdatedAt(record, now);
          });

          const duplicateMembers = activeMembersByAccountAndUser.filter(
            (member) => member.id !== existingMember.id,
          );

          for (const duplicateMember of duplicateMembers) {
            await duplicateMember.update((record) => {
              record.status = "inactive";
              record.deletedAt = now;
              markMemberPendingDelete(record);
              setUpdatedAt(record, now);
            });
          }
        });

        return {
          success: true,
          value: existingMember,
        };
      }

      let createdMember!: AccountMemberModel;

      await database.write(async () => {
        createdMember = await membersCollection.create((record) => {
          const now = Date.now();

          record.remoteId = payload.remoteId;
          record.accountRemoteId = payload.accountRemoteId;
          record.userRemoteId = payload.userRemoteId;
          record.status = payload.status;
          record.invitedByUserRemoteId = payload.invitedByUserRemoteId;
          record.joinedAt = payload.joinedAt;
          record.lastActiveAt = payload.lastActiveAt;

          record.recordSyncStatus = "pending_create";
          record.lastSyncedAt = null;
          record.deletedAt = null;

          setCreatedAndUpdatedAt(record, now);
        });
      });

      return {
        success: true,
        value: createdMember,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async deleteMemberByRemoteId(remoteId: string): Promise<Result<boolean>> {
    try {
      const membersCollection = database.get<AccountMemberModel>(ACCOUNT_MEMBERS_TABLE);
      const accountUserRolesCollection = database.get<AccountUserRoleModel>(
        ACCOUNT_USER_ROLES_TABLE,
      );
      const matchingMembers = await membersCollection
        .query(Q.where("remote_id", remoteId))
        .fetch();
      const targetMember = selectLatestByTimestamps(getActiveMemberRecords(matchingMembers));

      if (!targetMember) {
        return {
          success: true,
          value: true,
        };
      }

      await database.write(async () => {
        const now = Date.now();
        const assignments = await accountUserRolesCollection
          .query(
            Q.where("account_remote_id", targetMember.accountRemoteId),
            Q.where("user_remote_id", targetMember.userRemoteId),
          )
          .fetch();

        for (const assignment of assignments) {
          await assignment.destroyPermanently();
        }

        await targetMember.update((record) => {
          record.status = "inactive";
          record.deletedAt = now;
          markMemberPendingDelete(record);
          setUpdatedAt(record, now);
        });
      });

      return {
        success: true,
        value: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getActiveMemberAccountRemoteIdsByUserRemoteId(
    userRemoteId: string,
  ): Promise<Result<string[]>> {
    try {
      const membersCollection = database.get<AccountMemberModel>(ACCOUNT_MEMBERS_TABLE);
      const activeMembers = await membersCollection
        .query(
          Q.where("user_remote_id", userRemoteId),
          Q.where("status", "active"),
        )
        .fetch();
      const nonDeletedMembers = getActiveMemberRecords(activeMembers);

      const uniqueAccountRemoteIds = Array.from(
        new Set(nonDeletedMembers.map((member) => member.accountRemoteId)),
      );

      return {
        success: true,
        value: uniqueAccountRemoteIds,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async saveRole(
    payload: SaveAccountRoleRecordPayload,
  ): Promise<Result<AccountRoleModel>> {
    try {
      const rolesCollection = database.get<AccountRoleModel>(ACCOUNT_ROLES_TABLE);
      const rolesByRemoteId = await rolesCollection
        .query(Q.where("remote_id", payload.remoteId))
        .fetch();
      const rolesByAccountAndName = await rolesCollection
        .query(
          Q.where("account_remote_id", payload.accountRemoteId),
          Q.where("name", payload.name),
        )
        .fetch();
      const activeRolesByAccountAndName = getActiveRoleRecords(rolesByAccountAndName);
      const existingRoleByRemoteId = selectLatestByTimestamps(rolesByRemoteId);
      const conflictingRoleByName = activeRolesByAccountAndName.find(
        (role) => role.remoteId !== payload.remoteId,
      );

      if (conflictingRoleByName) {
        throw new Error("Conflict: role name already exists for this account.");
      }

      const existingRole = existingRoleByRemoteId;

      if (existingRole) {
        await database.write(async () => {
          const now = Date.now();
          await existingRole.update((record) => {
            record.remoteId = payload.remoteId;
            record.accountRemoteId = payload.accountRemoteId;
            record.name = payload.name;
            record.isSystem = payload.isSystem;
            record.isDefault = payload.isDefault;
            record.deletedAt = null;
            updateRoleSyncStatusOnMutation(record);
            setUpdatedAt(record, now);
          });

          const duplicateRolesByRemoteId = rolesByRemoteId.filter(
            (role) => role.id !== existingRole.id && role.deletedAt === null,
          );

          for (const duplicateRole of duplicateRolesByRemoteId) {
            await duplicateRole.update((record) => {
              record.deletedAt = now;
              record.isDefault = false;
              markRolePendingDelete(record);
              setUpdatedAt(record, now);
            });
          }
        });

        return {
          success: true,
          value: existingRole,
        };
      }

      let createdRole!: AccountRoleModel;

      await database.write(async () => {
        createdRole = await rolesCollection.create((record) => {
          const now = Date.now();

          record.remoteId = payload.remoteId;
          record.accountRemoteId = payload.accountRemoteId;
          record.name = payload.name;
          record.isSystem = payload.isSystem;
          record.isDefault = payload.isDefault;

          record.recordSyncStatus = "pending_create";
          record.lastSyncedAt = null;
          record.deletedAt = null;

          setCreatedAndUpdatedAt(record, now);
        });
      });

      return {
        success: true,
        value: createdRole,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async deleteRoleByRemoteId(remoteId: string): Promise<Result<boolean>> {
    try {
      const rolesCollection = database.get<AccountRoleModel>(ACCOUNT_ROLES_TABLE);
      const rolePermissionsCollection = database.get<AccountRolePermissionModel>(
        ACCOUNT_ROLE_PERMISSIONS_TABLE,
      );
      const accountUserRolesCollection = database.get<AccountUserRoleModel>(
        ACCOUNT_USER_ROLES_TABLE,
      );
      const matchingRoles = await rolesCollection
        .query(Q.where("remote_id", remoteId))
        .fetch();
      const targetRole = selectLatestByTimestamps(getActiveRoleRecords(matchingRoles));

      if (!targetRole) {
        return {
          success: true,
          value: true,
        };
      }

      await database.write(async () => {
        const activeAssignments = await accountUserRolesCollection
          .query(Q.where("role_remote_id", remoteId))
          .fetch();

        if (activeAssignments.length > 0) {
          throw new Error(
            "Conflict: role is currently assigned to users. Reassign members first.",
          );
        }

        const rolePermissions = await rolePermissionsCollection
          .query(Q.where("role_remote_id", remoteId))
          .fetch();

        for (const rolePermission of rolePermissions) {
          await rolePermission.destroyPermanently();
        }

        const now = Date.now();
        await targetRole.update((record) => {
          record.deletedAt = now;
          record.isDefault = false;
          markRolePendingDelete(record);
          setUpdatedAt(record, now);
        });
      });

      return {
        success: true,
        value: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async deleteRolePermissionsByRoleRemoteId(
    roleRemoteId: string,
  ): Promise<Result<boolean>> {
    try {
      const rolePermissionsCollection = database.get<AccountRolePermissionModel>(
        ACCOUNT_ROLE_PERMISSIONS_TABLE,
      );
      const rolePermissions = await rolePermissionsCollection
        .query(Q.where("role_remote_id", roleRemoteId))
        .fetch();

      if (rolePermissions.length === 0) {
        return {
          success: true,
          value: true,
        };
      }

      await database.write(async () => {
        for (const rolePermission of rolePermissions) {
          await rolePermission.destroyPermanently();
        }
      });

      return {
        success: true,
        value: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async replaceRolePermissions(
    roleRemoteId: string,
    permissionCodes: readonly string[],
  ): Promise<Result<boolean>> {
    try {
      const rolePermissionsCollection = database.get<AccountRolePermissionModel>(
        ACCOUNT_ROLE_PERMISSIONS_TABLE,
      );

      const existingRolePermissions = await rolePermissionsCollection
        .query(Q.where("role_remote_id", roleRemoteId))
        .fetch();

      const normalizedPermissionCodes = Array.from(
        new Set(
          permissionCodes
            .map((permissionCode) => permissionCode.trim())
            .filter(Boolean),
        ),
      );
      const nextPermissionCodeSet = new Set(normalizedPermissionCodes);
      const existingByPermissionCode = new Map<string, AccountRolePermissionModel[]>();

      for (const existingRolePermission of existingRolePermissions) {
        const existing = existingByPermissionCode.get(existingRolePermission.permissionCode) ?? [];
        existing.push(existingRolePermission);
        existingByPermissionCode.set(existingRolePermission.permissionCode, existing);
      }

      await database.write(async () => {
        for (const existingRolePermission of existingRolePermissions) {
          if (nextPermissionCodeSet.has(existingRolePermission.permissionCode)) {
            continue;
          }

          await existingRolePermission.destroyPermanently();
        }

        for (const permissionCode of normalizedPermissionCodes) {
          const existingRolePermissionRecords = existingByPermissionCode.get(permissionCode) ?? [];
          const canonicalRolePermission = selectLatestByTimestamps(existingRolePermissionRecords);

          if (canonicalRolePermission) {
            const duplicates = existingRolePermissionRecords.filter(
              (rolePermission) => rolePermission.id !== canonicalRolePermission.id,
            );

            for (const duplicateRolePermission of duplicates) {
              await duplicateRolePermission.destroyPermanently();
            }

            continue;
          }

          await rolePermissionsCollection.create((record) => {
            const now = Date.now();

            record.roleRemoteId = roleRemoteId;
            record.permissionCode = permissionCode;

            setCreatedAndUpdatedAt(record, now);
          });
        }
      });

      return {
        success: true,
        value: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getRolePermissionsByRoleRemoteIds(
    roleRemoteIds: readonly string[],
  ): Promise<Result<AccountRolePermissionModel[]>> {
    try {
      if (roleRemoteIds.length === 0) {
        return {
          success: true,
          value: [],
        };
      }

      const rolePermissionsCollection = database.get<AccountRolePermissionModel>(
        ACCOUNT_ROLE_PERMISSIONS_TABLE,
      );

      const rolePermissions = await rolePermissionsCollection
        .query(Q.where("role_remote_id", Q.oneOf([...roleRemoteIds])))
        .fetch();

      return {
        success: true,
        value: rolePermissions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async assignUserRole(
    payload: AssignAccountUserRoleRecordPayload,
  ): Promise<Result<AccountUserRoleModel>> {
    try {
      const accountUserRolesCollection = database.get<AccountUserRoleModel>(
        ACCOUNT_USER_ROLES_TABLE,
      );

      const existingAssignments = await accountUserRolesCollection
        .query(
          Q.where("account_remote_id", payload.accountRemoteId),
          Q.where("user_remote_id", payload.userRemoteId),
        )
        .fetch();

      const existingAssignment = selectLatestByTimestamps(existingAssignments);

      if (existingAssignment) {
        await database.write(async () => {
          const now = Date.now();
          await existingAssignment.update((record) => {
            record.roleRemoteId = payload.roleRemoteId;
            setUpdatedAt(record, now);
          });

          const duplicateAssignments = existingAssignments.filter(
            (assignment) => assignment.id !== existingAssignment.id,
          );

          for (const duplicateAssignment of duplicateAssignments) {
            await duplicateAssignment.destroyPermanently();
          }
        });

        return {
          success: true,
          value: existingAssignment,
        };
      }

      let createdAssignment!: AccountUserRoleModel;

      await database.write(async () => {
        createdAssignment = await accountUserRolesCollection.create((record) => {
          const now = Date.now();

          record.accountRemoteId = payload.accountRemoteId;
          record.userRemoteId = payload.userRemoteId;
          record.roleRemoteId = payload.roleRemoteId;

          setCreatedAndUpdatedAt(record, now);
        });
      });

      return {
        success: true,
        value: createdAssignment,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getUserRoleAssignment(
    accountRemoteId: string,
    userRemoteId: string,
  ): Promise<Result<AccountUserRoleModel | null>> {
    try {
      const accountUserRolesCollection = database.get<AccountUserRoleModel>(
        ACCOUNT_USER_ROLES_TABLE,
      );

      const assignments = await accountUserRolesCollection
        .query(
          Q.where("account_remote_id", accountRemoteId),
          Q.where("user_remote_id", userRemoteId),
        )
        .fetch();

      return {
        success: true,
        value: selectLatestByTimestamps(assignments),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async getUserRoleAssignmentsByAccountRemoteId(
    accountRemoteId: string,
  ): Promise<Result<AccountUserRoleModel[]>> {
    try {
      const accountUserRolesCollection = database.get<AccountUserRoleModel>(
        ACCOUNT_USER_ROLES_TABLE,
      );

      const assignments = await accountUserRolesCollection
        .query(Q.where("account_remote_id", accountRemoteId))
        .fetch();
      const assignmentByAccountAndUser = new Map<string, AccountUserRoleModel>();

      for (const assignment of [...assignments].sort((left, right) => {
        return right.updatedAt.getTime() - left.updatedAt.getTime();
      })) {
        const dedupeKey = `${assignment.accountRemoteId}:${assignment.userRemoteId}`;

        if (assignmentByAccountAndUser.has(dedupeKey)) {
          continue;
        }

        assignmentByAccountAndUser.set(dedupeKey, assignment);
      }

      return {
        success: true,
        value: [...assignmentByAccountAndUser.values()],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async deleteUserRoleAssignment(
    accountRemoteId: string,
    userRemoteId: string,
  ): Promise<Result<boolean>> {
    try {
      const accountUserRolesCollection = database.get<AccountUserRoleModel>(
        ACCOUNT_USER_ROLES_TABLE,
      );
      const assignments = await accountUserRolesCollection
        .query(
          Q.where("account_remote_id", accountRemoteId),
          Q.where("user_remote_id", userRemoteId),
        )
        .fetch();

      if (assignments.length === 0) {
        return {
          success: true,
          value: true,
        };
      }

      await database.write(async () => {
        for (const assignment of assignments) {
          await assignment.destroyPermanently();
        }
      });

      return {
        success: true,
        value: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async deleteUserRoleAssignmentsByRoleRemoteId(
    roleRemoteId: string,
  ): Promise<Result<boolean>> {
    try {
      const accountUserRolesCollection = database.get<AccountUserRoleModel>(
        ACCOUNT_USER_ROLES_TABLE,
      );
      const assignments = await accountUserRolesCollection
        .query(Q.where("role_remote_id", roleRemoteId))
        .fetch();

      if (assignments.length === 0) {
        return {
          success: true,
          value: true,
        };
      }

      await database.write(async () => {
        for (const assignment of assignments) {
          await assignment.destroyPermanently();
        }
      });

      return {
        success: true,
        value: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
