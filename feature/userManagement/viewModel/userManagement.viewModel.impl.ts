import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  getSignUpPhoneLengthForCountry,
  sanitizeSignUpPhoneDigits,
} from "@/feature/auth/signUp/utils/signUpPhoneNumber.util";
import {
  SIGN_UP_PHONE_COUNTRY_OPTIONS,
  SignUpPhoneCountryCode,
} from "@/feature/auth/signUp/types/signUp.types";
import {
  AccountMemberStatus,
  AccountMemberWithRole,
} from "../types/userManagement.types";
import { isDefaultBusinessRole } from "../types/userManagementDefaultRoles.shared";
import { ChangeAccountMemberStatusUseCase } from "../useCase/changeAccountMemberStatus.useCase";
import { CreateAccountMemberUseCase } from "../useCase/createAccountMember.useCase";
import { DeleteAccountMemberUseCase } from "../useCase/deleteAccountMember.useCase";
import { DeleteUserManagementRoleUseCase } from "../useCase/deleteUserManagementRole.useCase";
import { GetUserManagementSnapshotUseCase } from "../useCase/getUserManagementSnapshot.useCase";
import { SaveUserManagementRoleUseCase } from "../useCase/saveUserManagementRole.useCase";
import { UpdateAccountMemberUseCase } from "../useCase/updateAccountMember.useCase";
import {
  createInitialMemberEditorState,
  createInitialRoleEditorState,
  useUserManagementState,
  UserManagementMemberEditorFieldErrors,
  UserManagementRoleEditorFieldErrors,
  UserManagementRoleEditorState,
} from "./userManagement.state";
import { validateUserManagementMemberEditor } from "../validation/validateUserManagementMemberEditor";
import { validateUserManagementRoleEditor } from "../validation/validateUserManagementRoleEditor";
import {
  UseUserManagementViewModelParams,
  UserManagementMemberListItem,
  UserManagementRoleListItem,
  UserManagementViewModel,
} from "./userManagement.viewModel";

type UseUserManagementViewModelImplParams = UseUserManagementViewModelParams & {
  getUserManagementSnapshotUseCase: GetUserManagementSnapshotUseCase;
  createAccountMemberUseCase: CreateAccountMemberUseCase;
  updateAccountMemberUseCase: UpdateAccountMemberUseCase;
  changeAccountMemberStatusUseCase: ChangeAccountMemberStatusUseCase;
  deleteAccountMemberUseCase: DeleteAccountMemberUseCase;
  saveUserManagementRoleUseCase: SaveUserManagementRoleUseCase;
  deleteUserManagementRoleUseCase: DeleteUserManagementRoleUseCase;
};

const STAFF_MANAGEMENT_PERMISSION_CODE = "user_management.manage_staff";
const ROLE_MANAGEMENT_PERMISSION_CODE = "user_management.manage_roles";
const ROLE_ASSIGNMENT_PERMISSION_CODE = "user_management.assign_role";
const ALL_ROLE_FILTER_KEY = "all";
const UNASSIGNED_ROLE_FILTER_KEY = "unassigned";

const DEFAULT_MEMBER_PHONE_COUNTRY_CODE: SignUpPhoneCountryCode = "NP";

type RoleEditorLaunchSource =
  | "global"
  | "member_create_custom_role"
  | "member_manage_permissions";

const splitStoredPhoneNumber = (
  phoneNumber: string | null,
): { phoneCountryCode: SignUpPhoneCountryCode; phone: string } => {
  const normalizedPhoneNumber = (phoneNumber ?? "").trim();

  for (const phoneCountryOption of SIGN_UP_PHONE_COUNTRY_OPTIONS) {
    if (!normalizedPhoneNumber.startsWith(phoneCountryOption.dialCode)) {
      continue;
    }

    return {
      phoneCountryCode: phoneCountryOption.code,
      phone: sanitizeSignUpPhoneDigits(
        normalizedPhoneNumber.slice(phoneCountryOption.dialCode.length),
      ).slice(0, getSignUpPhoneLengthForCountry(phoneCountryOption.code)),
    };
  }

  return {
    phoneCountryCode: DEFAULT_MEMBER_PHONE_COUNTRY_CODE,
    phone: sanitizeSignUpPhoneDigits(normalizedPhoneNumber).slice(
      0,
      getSignUpPhoneLengthForCountry(DEFAULT_MEMBER_PHONE_COUNTRY_CODE),
    ),
  };
};

const normalizeRoleFilterKey = (roleName: string): string => roleName.trim().toLowerCase();

const formatDateLabel = (timestamp: number | null): string => {
  if (timestamp === null) {
    return "Unknown";
  }

  const value = new Date(timestamp);

  if (Number.isNaN(value.getTime())) {
    return "Unknown";
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const togglePermissionCode = (
  selectedPermissionCodes: readonly string[],
  permissionCode: string,
): string[] => {
  if (selectedPermissionCodes.includes(permissionCode)) {
    return selectedPermissionCodes
      .filter((selectedPermissionCode) => selectedPermissionCode !== permissionCode)
      .sort((left, right) => left.localeCompare(right));
  }

  return [...selectedPermissionCodes, permissionCode].sort((left, right) =>
    left.localeCompare(right),
  );
};

const buildRoleEditorStateFromRole = (
  role: {
    remoteId: string;
    name: string;
    permissionCodes: string[];
  },
): UserManagementRoleEditorState => ({
  mode: "edit",
  editingRoleRemoteId: role.remoteId,
  roleName: role.name,
  selectedPermissionCodes: [...role.permissionCodes].sort((left, right) =>
    left.localeCompare(right),
  ),
  fieldErrors: {},
});

const clearMemberFieldError = (
  fieldErrors: UserManagementMemberEditorFieldErrors,
  field: keyof UserManagementMemberEditorFieldErrors,
): UserManagementMemberEditorFieldErrors => {
  if (!fieldErrors[field]) {
    return fieldErrors;
  }

  return {
    ...fieldErrors,
    [field]: undefined,
  };
};

const clearRoleFieldError = (
  fieldErrors: UserManagementRoleEditorFieldErrors,
  field: keyof UserManagementRoleEditorFieldErrors,
): UserManagementRoleEditorFieldErrors => {
  if (!fieldErrors[field]) {
    return fieldErrors;
  }

  return {
    ...fieldErrors,
    [field]: undefined,
  };
};

const buildMemberListItem = (
  member: AccountMemberWithRole,
  canManageStaff: boolean,
): UserManagementMemberListItem => {
  const isActive = member.status === AccountMemberStatus.Active;

  return {
    memberRemoteId: member.remoteId,
    userRemoteId: member.userRemoteId,
    displayName: member.fullName,
    email: member.email,
    phone: member.phone,
    statusText: member.isAccountOwner
      ? "Owner"
      : isActive
        ? "Active"
        : member.status === AccountMemberStatus.Inactive
          ? "Inactive"
          : "Invited",
    joinedAtLabel: formatDateLabel(member.joinedAt ?? member.createdAt),
    roleLabel: member.roleName ?? "Unassigned",
    isActive,
    isAccountOwner: member.isAccountOwner,
    canEdit: canManageStaff,
    canToggleStatus: canManageStaff && !member.isAccountOwner,
    canDelete: canManageStaff && !member.isAccountOwner,
  };
};

export const useUserManagementViewModel = (
  params: UseUserManagementViewModelImplParams,
): UserManagementViewModel => {
  const {
    activeUserRemoteId,
    activeAccountRemoteId,
    getUserManagementSnapshotUseCase,
    createAccountMemberUseCase,
    updateAccountMemberUseCase,
    changeAccountMemberStatusUseCase,
    deleteAccountMemberUseCase,
    saveUserManagementRoleUseCase,
    deleteUserManagementRoleUseCase,
    onBack,
  } = params;

  const { state, actions } = useUserManagementState();
  const roleEditorRef = useRef(state.roleEditor);
  const memberEditorRef = useRef(state.memberEditor);
  const roleEditorLaunchSourceRef = useRef<RoleEditorLaunchSource>("global");

  useEffect(() => {
    roleEditorRef.current = state.roleEditor;
  }, [state.roleEditor]);

  useEffect(() => {
    memberEditorRef.current = state.memberEditor;
  }, [state.memberEditor]);

  const resetRoleEditorUiState = useCallback((): void => {
    actions.setRoleEditor(createInitialRoleEditorState());
    actions.setRoleEditorPresentation("role_form");
    actions.setIsRolePermissionEditEnabled(false);
    roleEditorLaunchSourceRef.current = "global";
  }, [actions]);

  const load = useCallback(
    async (shouldClearFeedback: boolean): Promise<void> => {
      actions.setIsLoading(true);

      if (shouldClearFeedback) {
        actions.clearFeedback();
      }

      try {
        if (!activeUserRemoteId || !activeAccountRemoteId) {
          actions.setMembers([]);
          actions.setPermissions([]);
          actions.setRoles([]);
          actions.setAssignedRoleRemoteId(null);
          actions.setGrantedPermissionCodes([]);
          actions.setMemberEditor(createInitialMemberEditorState());
          resetRoleEditorUiState();
          actions.setScreenError(
            "Active account session not found. Please sign in again.",
          );
          return;
        }

        const snapshotResult = await getUserManagementSnapshotUseCase.execute({
          accountRemoteId: activeAccountRemoteId,
          userRemoteId: activeUserRemoteId,
        });

        if (!snapshotResult.success) {
          actions.setMembers([]);
          actions.setPermissions([]);
          actions.setRoles([]);
          actions.setAssignedRoleRemoteId(null);
          actions.setGrantedPermissionCodes([]);
          actions.setMemberEditor(createInitialMemberEditorState());
          resetRoleEditorUiState();
          actions.setScreenError(snapshotResult.error.message);
          return;
        }

        actions.setMembers(snapshotResult.value.members);
        actions.setPermissions(snapshotResult.value.permissions);
        actions.setRoles(snapshotResult.value.roles);
        actions.setAssignedRoleRemoteId(snapshotResult.value.assignedRoleRemoteId);
        actions.setGrantedPermissionCodes(snapshotResult.value.grantedPermissionCodes);

        const currentRoleEditor = roleEditorRef.current;
        if (
          currentRoleEditor.mode === "edit" &&
          currentRoleEditor.editingRoleRemoteId
        ) {
          const roleStillExists = snapshotResult.value.roles.some(
            (role) => role.remoteId === currentRoleEditor.editingRoleRemoteId,
          );

          if (!roleStillExists) {
            resetRoleEditorUiState();
          }
        }

        const currentMemberEditor = memberEditorRef.current;
        if (currentMemberEditor.mode === "edit" && currentMemberEditor.editingMemberRemoteId) {
          const memberStillExists = snapshotResult.value.members.some(
            (member) => member.remoteId === currentMemberEditor.editingMemberRemoteId,
          );

          if (!memberStillExists) {
            actions.setMemberEditor(createInitialMemberEditorState());
          }
        }
      } catch (error) {
        actions.setMembers([]);
        actions.setPermissions([]);
        actions.setRoles([]);
        actions.setAssignedRoleRemoteId(null);
        actions.setGrantedPermissionCodes([]);
        actions.setMemberEditor(createInitialMemberEditorState());
        resetRoleEditorUiState();
        actions.setScreenError(
          error instanceof Error
            ? error.message
            : "Failed to load user management data.",
        );
      } finally {
        actions.setIsLoading(false);
      }
    },
    [
      actions,
      activeAccountRemoteId,
      activeUserRemoteId,
      getUserManagementSnapshotUseCase,
      resetRoleEditorUiState,
    ],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  const handleReload = useCallback(async (): Promise<void> => {
    await load(true);
  }, [load]);

  const canManageStaff = useMemo(
    () => state.grantedPermissionCodes.includes(STAFF_MANAGEMENT_PERMISSION_CODE),
    [state.grantedPermissionCodes],
  );

  const canManageRoles = useMemo(
    () => state.grantedPermissionCodes.includes(ROLE_MANAGEMENT_PERMISSION_CODE),
    [state.grantedPermissionCodes],
  );

  const canAssignRoles = useMemo(
    () => state.grantedPermissionCodes.includes(ROLE_ASSIGNMENT_PERMISSION_CODE),
    [state.grantedPermissionCodes],
  );
  const memberRoleOptions = useMemo(
    () =>
      state.roles
        .filter((role) => !(role.isSystem && role.name.trim().toLowerCase() === "owner"))
        .map((role) => ({
          remoteId: role.remoteId,
          label: role.name,
          isBusinessDefault: isDefaultBusinessRole({
            accountRemoteId: activeAccountRemoteId,
            roleRemoteId: role.remoteId,
            roleName: role.name,
          }),
        }))
        .sort((left, right) => {
          if (left.isBusinessDefault !== right.isBusinessDefault) {
            return left.isBusinessDefault ? -1 : 1;
          }

          return left.label.localeCompare(right.label);
        }),
    [activeAccountRemoteId, state.roles],
  );

  const hasAssignableRoles = memberRoleOptions.length > 0;

  const summaryCards = useMemo(() => {
    const totalMembers = state.members.length;
    const activeMembers = state.members.filter(
      (member) => member.status === AccountMemberStatus.Active,
    ).length;
    const inactiveMembers = Math.max(0, totalMembers - activeMembers);

    return [
      {
        id: "total" as const,
        label: "Total",
        value: totalMembers,
        tone: "neutral" as const,
      },
      {
        id: "active" as const,
        label: "Active",
        value: activeMembers,
        tone: "success" as const,
      },
      {
        id: "inactive" as const,
        label: "Inactive",
        value: inactiveMembers,
        tone: "danger" as const,
      },
    ];
  }, [state.members]);

  const roleFilters = useMemo(() => {
    const uniqueRoleFilterMap = new Map<string, string>();

    for (const role of state.roles) {
      const normalizedFilterKey = normalizeRoleFilterKey(role.name);

      if (!normalizedFilterKey || uniqueRoleFilterMap.has(normalizedFilterKey)) {
        continue;
      }

      uniqueRoleFilterMap.set(normalizedFilterKey, role.name.trim());
    }

    const roleNameFilters = Array.from(uniqueRoleFilterMap.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((left, right) => left.label.localeCompare(right.label));

    return [
      { key: ALL_ROLE_FILTER_KEY, label: "All" },
      ...roleNameFilters,
      { key: UNASSIGNED_ROLE_FILTER_KEY, label: "Unassigned" },
    ];
  }, [state.roles]);

  useEffect(() => {
    const selectedFilterExists = roleFilters.some(
      (roleFilter) => roleFilter.key === state.selectedRoleFilterKey,
    );

    if (selectedFilterExists) {
      return;
    }

    actions.setSelectedRoleFilterKey(ALL_ROLE_FILTER_KEY);
  }, [actions, roleFilters, state.selectedRoleFilterKey]);

  const memberListItems = useMemo(() => {
    const visibleMembers = state.members.filter((member) => {
      const memberRoleKey = member.roleName
        ? normalizeRoleFilterKey(member.roleName)
        : UNASSIGNED_ROLE_FILTER_KEY;
      const matchesFilter =
        state.selectedRoleFilterKey === ALL_ROLE_FILTER_KEY ||
        state.selectedRoleFilterKey === memberRoleKey;

      return matchesFilter;
    });

    return visibleMembers.map((member) => buildMemberListItem(member, canManageStaff));
  }, [canManageStaff, state.members, state.selectedRoleFilterKey]);

  const roleListItems = useMemo<readonly UserManagementRoleListItem[]>(() => {
    const assignedMemberCountByRoleRemoteId = new Map<string, number>();

    for (const member of state.members) {
      if (!member.roleRemoteId) {
        continue;
      }

      const currentCount =
        assignedMemberCountByRoleRemoteId.get(member.roleRemoteId) ?? 0;
      assignedMemberCountByRoleRemoteId.set(member.roleRemoteId, currentCount + 1);
    }

    return state.roles.map((role) => {
      const assignedMemberCount =
        assignedMemberCountByRoleRemoteId.get(role.remoteId) ?? 0;
      const canEdit = canManageRoles && !role.isSystem;
      const canDelete =
        canManageRoles &&
        !role.isSystem &&
        !role.isDefault &&
        assignedMemberCount === 0;

      return {
        roleRemoteId: role.remoteId,
        name: role.name,
        permissionCount: role.permissionCodes.length,
        assignedMemberCount,
        isSystem: role.isSystem,
        isDefault: role.isDefault,
        canEdit,
        canDelete,
      };
    });
  }, [canManageRoles, state.members, state.roles]);

  const onSelectRoleFilter = useCallback(
    (filterKey: string): void => {
      actions.setSelectedRoleFilterKey(filterKey);
    },
    [actions],
  );

  const onStartCreateMember = useCallback((): void => {
    if (!canManageStaff) {
      actions.setScreenError("You do not have permission to manage staff.");
      return;
    }
    if (!canAssignRoles) {
      actions.setScreenError("You do not have permission to assign roles.");
      return;
    }
    if (!hasAssignableRoles) {
      actions.setScreenError("Create a role before adding staff members.");
      return;
    }

    actions.clearFeedback();
    const preferredRoleOption =
      memberRoleOptions.find((roleOption) => roleOption.isBusinessDefault) ??
      memberRoleOptions[0] ??
      null;

    actions.setMemberEditor({
      mode: "create",
      editingMemberRemoteId: null,
      fullName: "",
      phoneCountryCode: DEFAULT_MEMBER_PHONE_COUNTRY_CODE,
      phone: "",
      email: "",
      password: "",
      roleRemoteId: preferredRoleOption?.remoteId ?? null,
      fieldErrors: {},
    });
  }, [
    actions,
    canAssignRoles,
    canManageStaff,
    hasAssignableRoles,
    memberRoleOptions,
  ]);

  const onStartEditMember = useCallback(
    (memberRemoteId: string): void => {
      if (!canManageStaff) {
        actions.setScreenError("You do not have permission to manage staff.");
        return;
      }

      const targetMember = state.members.find(
        (member) => member.remoteId === memberRemoteId,
      );

      if (!targetMember) {
        actions.setScreenError("Selected staff member was not found.");
        return;
      }

      const memberPhone = splitStoredPhoneNumber(targetMember.phone);

      actions.clearFeedback();
      actions.setMemberEditor({
        mode: "edit",
        editingMemberRemoteId: targetMember.remoteId,
        fullName: targetMember.fullName,
        phoneCountryCode: memberPhone.phoneCountryCode,
        phone: memberPhone.phone,
        email: targetMember.email ?? "",
        password: "",
        roleRemoteId: targetMember.roleRemoteId,
        fieldErrors: {},
      });
    },
    [actions, canManageStaff, state.members],
  );

  const onCancelMemberEditor = useCallback((): void => {
    actions.setMemberEditor(createInitialMemberEditorState());
    actions.clearFeedback();
  }, [actions]);

  const onChangeMemberFullName = useCallback(
    (fullName: string): void => {
      actions.setMemberEditor((previousEditorState) => ({
        ...previousEditorState,
        fullName,
        fieldErrors: clearMemberFieldError(
          previousEditorState.fieldErrors,
          "fullName",
        ),
      }));
      actions.clearFeedback();
    },
    [actions],
  );

  const onChangeMemberSelectedPhoneCountry = useCallback(
    (phoneCountryCode: SignUpPhoneCountryCode): void => {
      const nextPhoneMaxLength = getSignUpPhoneLengthForCountry(phoneCountryCode);

      actions.setMemberEditor((previousEditorState) => ({
        ...previousEditorState,
        phoneCountryCode,
        phone: sanitizeSignUpPhoneDigits(previousEditorState.phone).slice(
          0,
          nextPhoneMaxLength,
        ),
        fieldErrors: clearMemberFieldError(
          previousEditorState.fieldErrors,
          "phone",
        ),
      }));
      actions.clearFeedback();
    },
    [actions],
  );

  const onChangeMemberPhone = useCallback(
    (phone: string): void => {
      actions.setMemberEditor((previousEditorState) => ({
        ...previousEditorState,
        phone: sanitizeSignUpPhoneDigits(phone).slice(
          0,
          getSignUpPhoneLengthForCountry(previousEditorState.phoneCountryCode),
        ),
        fieldErrors: clearMemberFieldError(
          previousEditorState.fieldErrors,
          "phone",
        ),
      }));
      actions.clearFeedback();
    },
    [actions],
  );

  const onChangeMemberEmail = useCallback(
    (email: string): void => {
      actions.setMemberEditor((previousEditorState) => ({
        ...previousEditorState,
        email,
      }));
      actions.clearFeedback();
    },
    [actions],
  );

  const onChangeMemberPassword = useCallback(
    (password: string): void => {
      actions.setMemberEditor((previousEditorState) => ({
        ...previousEditorState,
        password,
        fieldErrors: clearMemberFieldError(
          previousEditorState.fieldErrors,
          "password",
        ),
      }));
      actions.clearFeedback();
    },
    [actions],
  );

  const onChangeMemberRole = useCallback(
    (roleRemoteId: string): void => {
      actions.setMemberEditor((previousEditorState) => ({
        ...previousEditorState,
        roleRemoteId,
        fieldErrors: clearMemberFieldError(
          previousEditorState.fieldErrors,
          "roleRemoteId",
        ),
      }));
      actions.clearFeedback();
    },
    [actions],
  );

  const onStartCreateCustomRoleForMember = useCallback((): void => {
    if (!canManageRoles) {
      actions.setScreenError("You do not have permission to create custom roles.");
      return;
    }

    roleEditorLaunchSourceRef.current = "member_create_custom_role";
    actions.clearFeedback();
    actions.setRoleEditorPresentation("role_form");
    actions.setIsRolePermissionEditEnabled(true);
    actions.setRoleEditor({
      mode: "create",
      editingRoleRemoteId: null,
      roleName: "",
      selectedPermissionCodes: [],
      fieldErrors: {},
    });
  }, [actions, canManageRoles]);

  const onManageSelectedMemberRolePermissions = useCallback((): void => {
    if (!canManageRoles) {
      actions.setScreenError("You do not have permission to edit role permissions.");
      return;
    }

    const selectedRoleRemoteId = memberEditorRef.current.roleRemoteId;

    if (!selectedRoleRemoteId) {
      actions.setScreenError("Select a role before managing permissions.");
      return;
    }

    const selectedRole = state.roles.find(
      (role) => role.remoteId === selectedRoleRemoteId,
    );

    if (!selectedRole) {
      actions.setScreenError("Selected role was not found.");
      return;
    }

    if (selectedRole.isSystem) {
      actions.setScreenError("System roles cannot be edited.");
      return;
    }

    roleEditorLaunchSourceRef.current = "member_manage_permissions";
    actions.clearFeedback();
    actions.setRoleEditorPresentation("permission_manager");
    actions.setIsRolePermissionEditEnabled(false);
    actions.setRoleEditor(buildRoleEditorStateFromRole(selectedRole));
  }, [actions, canManageRoles, state.roles]);

  const onSaveMember = useCallback(async (): Promise<void> => {
    if (!canManageStaff) {
      actions.setScreenError("You do not have permission to manage staff.");
      return;
    }

    if (!activeAccountRemoteId || !activeUserRemoteId) {
      actions.setScreenError("Active account session not found.");
      return;
    }

    if (!state.memberEditor.mode) {
      actions.setScreenError("Select create or edit mode before saving a staff member.");
      return;
    }

    const memberFieldErrors = validateUserManagementMemberEditor({
      mode: state.memberEditor.mode,
      fullName: state.memberEditor.fullName,
      phoneCountryCode: state.memberEditor.phoneCountryCode,
      phone: state.memberEditor.phone,
      password: state.memberEditor.password,
      roleRemoteId: state.memberEditor.roleRemoteId,
    });

    if (Object.values(memberFieldErrors).some(Boolean)) {
      actions.setMemberEditor((previousEditorState) => ({
        ...previousEditorState,
        fieldErrors: memberFieldErrors,
      }));
      actions.clearFeedback();
      return;
    }

    actions.setIsSavingMember(true);
    actions.clearFeedback();

    try {
      if (state.memberEditor.mode === "create") {
        if (!state.memberEditor.roleRemoteId) {
          actions.setScreenError(
            hasAssignableRoles
              ? "Select a role for this staff member."
              : "Create a role before adding staff members.",
          );
          return;
        }

        const createMemberResult = await createAccountMemberUseCase.execute({
          accountRemoteId: activeAccountRemoteId,
          actorUserRemoteId: activeUserRemoteId,
          fullName: state.memberEditor.fullName,
          email: state.memberEditor.email.trim()
            ? state.memberEditor.email.trim()
            : null,
          phoneCountryCode: state.memberEditor.phoneCountryCode,
          phone: state.memberEditor.phone,
          password: state.memberEditor.password,
          roleRemoteId: state.memberEditor.roleRemoteId,
        });

        if (!createMemberResult.success) {
          actions.setScreenError(createMemberResult.error.message);
          return;
        }
      } else {
        if (!state.memberEditor.editingMemberRemoteId) {
          actions.setScreenError("Selected staff member was not found.");
          return;
        }

        const updateMemberResult = await updateAccountMemberUseCase.execute({
          accountRemoteId: activeAccountRemoteId,
          actorUserRemoteId: activeUserRemoteId,
          memberRemoteId: state.memberEditor.editingMemberRemoteId,
          fullName: state.memberEditor.fullName,
          email: state.memberEditor.email,
          phoneCountryCode: state.memberEditor.phoneCountryCode,
          phone: state.memberEditor.phone,
          password: state.memberEditor.password.trim()
            ? state.memberEditor.password
            : null,
          roleRemoteId: state.memberEditor.roleRemoteId,
        });

        if (!updateMemberResult.success) {
          actions.setScreenError(updateMemberResult.error.message);
          return;
        }
      }

      actions.setMemberEditor(createInitialMemberEditorState());
      await load(false);
      actions.setScreenSuccess("Staff member saved successfully.");
    } catch (error) {
      actions.setScreenError(
        error instanceof Error ? error.message : "Failed to save staff member.",
      );
    } finally {
      actions.setIsSavingMember(false);
    }
  }, [
    actions,
    activeAccountRemoteId,
    activeUserRemoteId,
    canManageStaff,
    createAccountMemberUseCase,
    load,
    hasAssignableRoles,
    state.memberEditor.editingMemberRemoteId,
    state.memberEditor.email,
    state.memberEditor.fullName,
    state.memberEditor.mode,
    state.memberEditor.password,
    state.memberEditor.phone,
    state.memberEditor.phoneCountryCode,
    state.memberEditor.roleRemoteId,
    updateAccountMemberUseCase,
  ]);

  const onToggleMemberStatus = useCallback(
    async (
      memberRemoteId: string,
      nextStatus: "active" | "inactive",
    ): Promise<void> => {
      if (!canManageStaff) {
        actions.setScreenError("You do not have permission to manage staff.");
        return;
      }

      if (!activeAccountRemoteId || !activeUserRemoteId) {
        actions.setScreenError("Active account session not found.");
        return;
      }

      actions.setIsUpdatingMemberStatus(true);
      actions.clearFeedback();

      try {
        const changeStatusResult = await changeAccountMemberStatusUseCase.execute({
          accountRemoteId: activeAccountRemoteId,
          actorUserRemoteId: activeUserRemoteId,
          memberRemoteId,
          status: nextStatus,
        });

        if (!changeStatusResult.success) {
          actions.setScreenError(changeStatusResult.error.message);
          return;
        }

        await load(false);
        actions.setScreenSuccess("Staff status updated.");
      } catch (error) {
        actions.setScreenError(
          error instanceof Error ? error.message : "Failed to update member status.",
        );
      } finally {
        actions.setIsUpdatingMemberStatus(false);
      }
    },
    [
      actions,
      activeAccountRemoteId,
      activeUserRemoteId,
      canManageStaff,
      changeAccountMemberStatusUseCase,
      load,
    ],
  );

  const onDeleteMember = useCallback(
    async (memberRemoteId: string): Promise<void> => {
      if (!canManageStaff) {
        actions.setScreenError("You do not have permission to manage staff.");
        return;
      }

      if (!activeAccountRemoteId || !activeUserRemoteId) {
        actions.setScreenError("Active account session not found.");
        return;
      }

      actions.setIsDeletingMember(true);
      actions.clearFeedback();

      try {
        const deleteMemberResult = await deleteAccountMemberUseCase.execute({
          accountRemoteId: activeAccountRemoteId,
          actorUserRemoteId: activeUserRemoteId,
          memberRemoteId,
        });

        if (!deleteMemberResult.success) {
          actions.setScreenError(deleteMemberResult.error.message);
          return;
        }

        if (state.memberEditor.editingMemberRemoteId === memberRemoteId) {
          actions.setMemberEditor(createInitialMemberEditorState());
        }

        await load(false);
        actions.setScreenSuccess("Staff member deleted successfully.");
      } catch (error) {
        actions.setScreenError(
          error instanceof Error ? error.message : "Failed to delete staff member.",
        );
      } finally {
        actions.setIsDeletingMember(false);
      }
    },
    [
      actions,
      activeAccountRemoteId,
      activeUserRemoteId,
      canManageStaff,
      deleteAccountMemberUseCase,
      load,
      state.memberEditor.editingMemberRemoteId,
    ],
  );

  const onStartCreateRole = useCallback((): void => {
    if (!canManageRoles) {
      actions.setScreenError("You do not have permission to create or edit roles.");
      return;
    }

    roleEditorLaunchSourceRef.current = "global";
    actions.clearFeedback();
    actions.setRoleEditorPresentation("role_form");
    actions.setIsRolePermissionEditEnabled(true);
    actions.setRoleEditor({
      mode: "create",
      editingRoleRemoteId: null,
      roleName: "",
      selectedPermissionCodes: [],
      fieldErrors: {},
    });
  }, [actions, canManageRoles]);

  const onStartEditRole = useCallback(
    (roleRemoteId: string): void => {
      if (!canManageRoles) {
        actions.setScreenError("You do not have permission to create or edit roles.");
        return;
      }

      const targetRole = state.roles.find((role) => role.remoteId === roleRemoteId);

      if (!targetRole) {
        actions.setScreenError("Selected role was not found.");
        return;
      }

      if (targetRole.isSystem) {
        actions.setScreenError("System roles cannot be edited.");
        return;
      }

      roleEditorLaunchSourceRef.current = "global";
      actions.clearFeedback();
      actions.setRoleEditorPresentation("role_form");
      actions.setIsRolePermissionEditEnabled(true);
      actions.setRoleEditor(buildRoleEditorStateFromRole(targetRole));
    },
    [actions, canManageRoles, state.roles],
  );

  const onCancelRoleEditor = useCallback((): void => {
    resetRoleEditorUiState();
    actions.clearFeedback();
  }, [actions, resetRoleEditorUiState]);

  const onChangeRoleName = useCallback(
    (roleName: string): void => {
      actions.setRoleEditor((previousEditorState) => ({
        ...previousEditorState,
        roleName,
        fieldErrors: clearRoleFieldError(
          previousEditorState.fieldErrors,
          "roleName",
        ),
      }));
      actions.clearFeedback();
    },
    [actions],
  );

  const onEnableRolePermissionEdit = useCallback((): void => {
    if (!canManageRoles) {
      actions.setScreenError("You do not have permission to edit role permissions.");
      return;
    }

    if (!state.roleEditor.mode) {
      actions.setScreenError("Open role permissions before editing.");
      return;
    }

    actions.setIsRolePermissionEditEnabled(true);
    actions.clearFeedback();
  }, [actions, canManageRoles, state.roleEditor.mode]);

  const onToggleRolePermission = useCallback(
    (permissionCode: string): void => {
      if (
        state.roleEditorPresentation === "permission_manager" &&
        !state.isRolePermissionEditEnabled
      ) {
        return;
      }

      actions.setRoleEditor((previousEditorState) => {
        if (!previousEditorState.mode) {
          return previousEditorState;
        }

        return {
          ...previousEditorState,
          selectedPermissionCodes: togglePermissionCode(
            previousEditorState.selectedPermissionCodes,
            permissionCode,
          ),
        };
      });

      actions.clearFeedback();
    },
    [
      actions,
      state.isRolePermissionEditEnabled,
      state.roleEditorPresentation,
    ],
  );

  const onSaveRole = useCallback(async (): Promise<void> => {
    if (!canManageRoles) {
      actions.setScreenError("You do not have permission to create or edit roles.");
      return;
    }

    if (!activeAccountRemoteId || !activeUserRemoteId) {
      actions.setScreenError("Active account session not found.");
      return;
    }

    if (!state.roleEditor.mode) {
      actions.setScreenError("Select create or edit mode before saving a role.");
      return;
    }

    const roleFieldErrors = validateUserManagementRoleEditor({
      roleName: state.roleEditor.roleName,
    });

    if (Object.values(roleFieldErrors).some(Boolean)) {
      actions.setRoleEditor((previousEditorState) => ({
        ...previousEditorState,
        fieldErrors: roleFieldErrors,
      }));
      actions.clearFeedback();
      return;
    }

    actions.setIsSavingRole(true);
    actions.clearFeedback();

    try {
      const roleEditorLaunchSource = roleEditorLaunchSourceRef.current;
      const saveRoleResult = await saveUserManagementRoleUseCase.execute({
        remoteId: state.roleEditor.editingRoleRemoteId,
        accountRemoteId: activeAccountRemoteId,
        actorUserRemoteId: activeUserRemoteId,
        name: state.roleEditor.roleName,
        permissionCodes: state.roleEditor.selectedPermissionCodes,
        isSystem: null,
        isDefault: null,
      });

      if (!saveRoleResult.success) {
        actions.setScreenError(saveRoleResult.error.message);
        return;
      }

      if (roleEditorLaunchSource === "member_create_custom_role") {
        actions.setMemberEditor((previousEditorState) => {
          if (!previousEditorState.mode) {
            return previousEditorState;
          }

          return {
            ...previousEditorState,
            roleRemoteId: saveRoleResult.value.remoteId,
            fieldErrors: {
              ...previousEditorState.fieldErrors,
              roleRemoteId: undefined,
            },
          };
        });
      }

      resetRoleEditorUiState();
      await load(false);
      actions.setScreenSuccess(
        roleEditorLaunchSource === "member_create_custom_role"
          ? "Custom role created and selected."
          : roleEditorLaunchSource === "member_manage_permissions"
            ? "Role permissions updated successfully."
            : "Role saved successfully.",
      );
    } catch (error) {
      actions.setScreenError(error instanceof Error ? error.message : "Failed to save role.");
    } finally {
      actions.setIsSavingRole(false);
    }
  }, [
    actions,
    activeAccountRemoteId,
    activeUserRemoteId,
    canManageRoles,
    load,
    resetRoleEditorUiState,
    saveUserManagementRoleUseCase,
    state.roleEditor.editingRoleRemoteId,
    state.roleEditor.mode,
    state.roleEditor.roleName,
    state.roleEditor.selectedPermissionCodes,
  ]);

  const onDoneRolePermissionManager = useCallback(async (): Promise<void> => {
    if (state.roleEditorPresentation !== "permission_manager") {
      await onSaveRole();
      return;
    }

    if (!state.isRolePermissionEditEnabled) {
      onCancelRoleEditor();
      return;
    }

    await onSaveRole();
  }, [
    onCancelRoleEditor,
    onSaveRole,
    state.isRolePermissionEditEnabled,
    state.roleEditorPresentation,
  ]);

  const onDeleteRole = useCallback(
    async (roleRemoteId: string): Promise<void> => {
      if (!canManageRoles) {
        actions.setScreenError("You do not have permission to delete roles.");
        return;
      }

      if (!activeAccountRemoteId || !activeUserRemoteId) {
        actions.setScreenError("Active account session not found.");
        return;
      }

      actions.setIsDeletingRole(true);
      actions.clearFeedback();

      try {
        const deleteRoleResult = await deleteUserManagementRoleUseCase.execute({
          accountRemoteId: activeAccountRemoteId,
          actorUserRemoteId: activeUserRemoteId,
          roleRemoteId,
        });

        if (!deleteRoleResult.success) {
          actions.setScreenError(deleteRoleResult.error.message);
          return;
        }

        if (state.roleEditor.editingRoleRemoteId === roleRemoteId) {
          resetRoleEditorUiState();
        }

        await load(false);
        actions.setScreenSuccess("Role deleted successfully.");
      } catch (error) {
        actions.setScreenError(error instanceof Error ? error.message : "Failed to delete role.");
      } finally {
        actions.setIsDeletingRole(false);
      }
    },
    [
      actions,
      activeAccountRemoteId,
      activeUserRemoteId,
      canManageRoles,
      deleteUserManagementRoleUseCase,
      load,
      resetRoleEditorUiState,
      state.roleEditor.editingRoleRemoteId,
    ],
  );

  return useMemo<UserManagementViewModel>(
    () => ({
      isLoading: state.isLoading,
      isSavingMember: state.isSavingMember,
      isUpdatingMemberStatus: state.isUpdatingMemberStatus,
      isDeletingMember: state.isDeletingMember,
      isSavingRole: state.isSavingRole,
      isDeletingRole: state.isDeletingRole,
      members: state.members,
      roles: state.roles,
      permissions: state.permissions,
      assignedRoleRemoteId: state.assignedRoleRemoteId,
      grantedPermissionCodes: state.grantedPermissionCodes,
      selectedRoleFilterKey: state.selectedRoleFilterKey,
      summaryCards,
      roleFilters,
      memberListItems,
      roleListItems,
      memberRoleOptions,
      memberEditor: state.memberEditor,
      roleEditor: state.roleEditor,
      roleEditorPresentation: state.roleEditorPresentation,
      isRolePermissionEditEnabled: state.isRolePermissionEditEnabled,
      canManageStaff,
      canManageRoles,
      canAssignRoles,
      screenError: state.screenError,
      screenSuccess: state.screenSuccess,
      onSelectRoleFilter,
      onReload: handleReload,
      onStartCreateMember,
      onStartEditMember,
      onCancelMemberEditor,
      onChangeMemberFullName,
      onChangeMemberSelectedPhoneCountry,
      onChangeMemberPhone,
      onChangeMemberEmail,
      onChangeMemberPassword,
      onChangeMemberRole,
      onStartCreateCustomRoleForMember,
      onManageSelectedMemberRolePermissions,
      onSaveMember,
      onToggleMemberStatus,
      onDeleteMember,
      onStartCreateRole,
      onStartEditRole,
      onDeleteRole,
      onCancelRoleEditor,
      onChangeRoleName,
      onEnableRolePermissionEdit,
      onDoneRolePermissionManager,
      onToggleRolePermission,
      onSaveRole,
      onBack,
    }),
    [
      canAssignRoles,
      canManageRoles,
      canManageStaff,
      handleReload,
      memberListItems,
      memberRoleOptions,
      roleListItems,
      onBack,
      onCancelMemberEditor,
      onCancelRoleEditor,
      onChangeMemberEmail,
      onChangeMemberFullName,
      onChangeMemberPassword,
      onChangeMemberSelectedPhoneCountry,
      onChangeMemberPhone,
      onChangeMemberRole,
      onChangeRoleName,
      onDeleteMember,
      onDeleteRole,
      onDoneRolePermissionManager,
      onEnableRolePermissionEdit,
      onManageSelectedMemberRolePermissions,
      onSaveMember,
      onSaveRole,
      onSelectRoleFilter,
      onStartCreateCustomRoleForMember,
      onStartCreateMember,
      onStartCreateRole,
      onStartEditMember,
      onStartEditRole,
      onToggleMemberStatus,
      onToggleRolePermission,
      roleFilters,
      state.assignedRoleRemoteId,
      state.grantedPermissionCodes,
      state.isDeletingMember,
      state.isDeletingRole,
      state.isLoading,
      state.isSavingMember,
      state.isSavingRole,
      state.isRolePermissionEditEnabled,
      state.isUpdatingMemberStatus,
      state.memberEditor,
      state.members,
      state.permissions,
      state.roleEditor,
      state.roleEditorPresentation,
      state.roles,
      state.screenError,
      state.screenSuccess,
      state.selectedRoleFilterKey,
      summaryCards,
    ],
  );
};
