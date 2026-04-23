import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  AccountMemberWithRole,
  UserManagementPermission,
  UserManagementRole,
} from "../types/userManagement.types";
import { SignUpPhoneCountryCode } from "@/feature/auth/signUp/types/signUp.types";

export type UserManagementRoleEditorMode = "create" | "edit" | null;
export type UserManagementRoleEditorPresentation =
  | "role_form"
  | "permission_manager";

export type UserManagementRoleEditorFieldName = "roleName";
export type UserManagementRoleEditorFieldErrors = Partial<
  Record<UserManagementRoleEditorFieldName, string>
>;

export type UserManagementRoleEditorState = {
  mode: UserManagementRoleEditorMode;
  editingRoleRemoteId: string | null;
  roleName: string;
  selectedPermissionCodes: string[];
  fieldErrors: UserManagementRoleEditorFieldErrors;
};

export type UserManagementMemberEditorMode = "create" | "edit" | null;

export type UserManagementMemberEditorFieldName =
  | "fullName"
  | "phone"
  | "password"
  | "roleRemoteId";

export type UserManagementMemberEditorFieldErrors = Partial<
  Record<UserManagementMemberEditorFieldName, string>
>;

export type UserManagementMemberEditorState = {
  mode: UserManagementMemberEditorMode;
  editingMemberRemoteId: string | null;
  fullName: string;
  phoneCountryCode: SignUpPhoneCountryCode;
  phone: string;
  email: string;
  password: string;
  roleRemoteId: string | null;
  fieldErrors: UserManagementMemberEditorFieldErrors;
};

export type UserManagementState = {
  isLoading: boolean;
  isSavingMember: boolean;
  isUpdatingMemberStatus: boolean;
  isDeletingMember: boolean;
  isSavingRole: boolean;
  isDeletingRole: boolean;
  members: AccountMemberWithRole[];
  roles: UserManagementRole[];
  permissions: UserManagementPermission[];
  assignedRoleRemoteId: string | null;
  grantedPermissionCodes: string[];
  selectedRoleFilterKey: string;
  memberEditor: UserManagementMemberEditorState;
  roleEditor: UserManagementRoleEditorState;
  roleEditorPresentation: UserManagementRoleEditorPresentation;
  isRolePermissionEditEnabled: boolean;
  screenError: string | null;
  screenSuccess: string | null;
};

export type UserManagementStateActions = {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setIsSavingMember: Dispatch<SetStateAction<boolean>>;
  setIsUpdatingMemberStatus: Dispatch<SetStateAction<boolean>>;
  setIsDeletingMember: Dispatch<SetStateAction<boolean>>;
  setIsSavingRole: Dispatch<SetStateAction<boolean>>;
  setIsDeletingRole: Dispatch<SetStateAction<boolean>>;
  setMembers: Dispatch<SetStateAction<AccountMemberWithRole[]>>;
  setRoles: Dispatch<SetStateAction<UserManagementRole[]>>;
  setPermissions: Dispatch<SetStateAction<UserManagementPermission[]>>;
  setAssignedRoleRemoteId: Dispatch<SetStateAction<string | null>>;
  setGrantedPermissionCodes: Dispatch<SetStateAction<string[]>>;
  setSelectedRoleFilterKey: Dispatch<SetStateAction<string>>;
  setMemberEditor: Dispatch<SetStateAction<UserManagementMemberEditorState>>;
  setRoleEditor: Dispatch<SetStateAction<UserManagementRoleEditorState>>;
  setRoleEditorPresentation: Dispatch<
    SetStateAction<UserManagementRoleEditorPresentation>
  >;
  setIsRolePermissionEditEnabled: Dispatch<SetStateAction<boolean>>;
  setScreenError: Dispatch<SetStateAction<string | null>>;
  setScreenSuccess: Dispatch<SetStateAction<string | null>>;
  clearFeedback: () => void;
};

const INITIAL_ROLE_EDITOR_STATE: UserManagementRoleEditorState = {
  mode: null,
  editingRoleRemoteId: null,
  roleName: "",
  selectedPermissionCodes: [],
  fieldErrors: {},
};
const INITIAL_ROLE_EDITOR_PRESENTATION: UserManagementRoleEditorPresentation =
  "role_form";

const INITIAL_MEMBER_EDITOR_STATE: UserManagementMemberEditorState = {
  mode: null,
  editingMemberRemoteId: null,
  fullName: "",
  phoneCountryCode: "NP",
  phone: "",
  email: "",
  password: "",
  roleRemoteId: null,
  fieldErrors: {},
};

const INITIAL_ROLE_FILTER_KEY = "all";

export const useUserManagementState = (): {
  state: UserManagementState;
  actions: UserManagementStateActions;
} => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [isUpdatingMemberStatus, setIsUpdatingMemberStatus] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [members, setMembers] = useState<AccountMemberWithRole[]>([]);
  const [roles, setRoles] = useState<UserManagementRole[]>([]);
  const [permissions, setPermissions] = useState<UserManagementPermission[]>([]);
  const [assignedRoleRemoteId, setAssignedRoleRemoteId] = useState<string | null>(
    null,
  );
  const [grantedPermissionCodes, setGrantedPermissionCodes] = useState<string[]>([]);
  const [selectedRoleFilterKey, setSelectedRoleFilterKey] = useState(
    INITIAL_ROLE_FILTER_KEY,
  );
  const [memberEditor, setMemberEditor] =
    useState<UserManagementMemberEditorState>(INITIAL_MEMBER_EDITOR_STATE);
  const [roleEditor, setRoleEditor] =
    useState<UserManagementRoleEditorState>(INITIAL_ROLE_EDITOR_STATE);
  const [roleEditorPresentation, setRoleEditorPresentation] =
    useState<UserManagementRoleEditorPresentation>(
      INITIAL_ROLE_EDITOR_PRESENTATION,
    );
  const [isRolePermissionEditEnabled, setIsRolePermissionEditEnabled] =
    useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [screenSuccess, setScreenSuccess] = useState<string | null>(null);

  const clearFeedback = useCallback(() => {
    setScreenError(null);
    setScreenSuccess(null);
  }, []);

  const state = useMemo<UserManagementState>(
    () => ({
      isLoading,
      isSavingMember,
      isUpdatingMemberStatus,
      isDeletingMember,
      isSavingRole,
      isDeletingRole,
      members,
      roles,
      permissions,
      assignedRoleRemoteId,
      grantedPermissionCodes,
      selectedRoleFilterKey,
      memberEditor,
      roleEditor,
      roleEditorPresentation,
      isRolePermissionEditEnabled,
      screenError,
      screenSuccess,
    }),
    [
      assignedRoleRemoteId,
      grantedPermissionCodes,
      isLoading,
      isSavingMember,
      isUpdatingMemberStatus,
      isDeletingMember,
      isSavingRole,
      isDeletingRole,
      memberEditor,
      members,
      isRolePermissionEditEnabled,
      permissions,
      roleEditorPresentation,
      selectedRoleFilterKey,
      roleEditor,
      roles,
      screenError,
      screenSuccess,
    ],
  );

  const actions = useMemo<UserManagementStateActions>(
    () => ({
      setIsLoading,
      setIsSavingMember,
      setIsUpdatingMemberStatus,
      setIsDeletingMember,
      setIsSavingRole,
      setIsDeletingRole,
      setMembers,
      setRoles,
      setPermissions,
      setAssignedRoleRemoteId,
      setGrantedPermissionCodes,
      setSelectedRoleFilterKey,
      setMemberEditor,
      setRoleEditor,
      setRoleEditorPresentation,
      setIsRolePermissionEditEnabled,
      setScreenError,
      setScreenSuccess,
      clearFeedback,
    }),
    [clearFeedback],
  );

  return { state, actions };
};

export const createInitialRoleEditorState = (): UserManagementRoleEditorState => {
  return {
    ...INITIAL_ROLE_EDITOR_STATE,
    selectedPermissionCodes: [],
    fieldErrors: {},
  };
};

export const createInitialMemberEditorState = (): UserManagementMemberEditorState => {
  return {
    ...INITIAL_MEMBER_EDITOR_STATE,
    fieldErrors: {},
  };
};
