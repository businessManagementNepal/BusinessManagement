import { UserManagementRoleEditorFieldErrors } from "@/feature/userManagement/viewModel/userManagement.state";

type ValidateUserManagementRoleEditorParams = {
  roleName: string;
};

export const validateUserManagementRoleEditor = ({
  roleName,
}: ValidateUserManagementRoleEditorParams): UserManagementRoleEditorFieldErrors => {
  const nextFieldErrors: UserManagementRoleEditorFieldErrors = {};
  const normalizedRoleName = roleName.trim();

  if (normalizedRoleName.length < 2) {
    nextFieldErrors.roleName = "Role name must be at least 2 characters.";
  }

  return nextFieldErrors;
};
