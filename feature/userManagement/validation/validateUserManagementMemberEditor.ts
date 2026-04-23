import {
  getInvalidSignUpPhoneMessageForCountry,
  isValidSignUpPhoneForCountry,
  sanitizeSignUpPhoneDigits,
} from "@/feature/auth/signUp/utils/signUpPhoneNumber.util";
import { SignUpPhoneCountryCode } from "@/feature/auth/signUp/types/signUp.types";
import { UserManagementMemberEditorFieldErrors } from "@/feature/userManagement/viewModel/userManagement.state";

type ValidateUserManagementMemberEditorParams = {
  mode: "create" | "edit";
  fullName: string;
  phoneCountryCode: SignUpPhoneCountryCode;
  phone: string;
  password: string;
  roleRemoteId: string | null;
};

export const validateUserManagementMemberEditor = ({
  mode,
  fullName,
  phoneCountryCode,
  phone,
  password,
  roleRemoteId,
}: ValidateUserManagementMemberEditorParams): UserManagementMemberEditorFieldErrors => {
  const nextFieldErrors: UserManagementMemberEditorFieldErrors = {};

  const normalizedFullName = fullName.trim();
  if (normalizedFullName.length < 2) {
    nextFieldErrors.fullName = "Full name must be at least 2 characters.";
  }

  const normalizedPhoneDigits = sanitizeSignUpPhoneDigits(phone);
  if (!isValidSignUpPhoneForCountry(normalizedPhoneDigits, phoneCountryCode)) {
    nextFieldErrors.phone =
      getInvalidSignUpPhoneMessageForCountry(phoneCountryCode);
  }

  const normalizedPassword = password.trim();
  if (mode === "create") {
    if (normalizedPassword.length < 6) {
      nextFieldErrors.password = "Password must be at least 6 characters.";
    }

    if (!roleRemoteId?.trim()) {
      nextFieldErrors.roleRemoteId = "Select a role for this staff member.";
    }
  } else if (normalizedPassword.length > 0 && normalizedPassword.length < 6) {
    nextFieldErrors.password = "Password must be at least 6 characters.";
  }

  return nextFieldErrors;
};
