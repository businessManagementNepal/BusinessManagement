import { describe, expect, it } from "vitest";
import { validateUserManagementMemberEditor } from "@/feature/userManagement/validation/validateUserManagementMemberEditor";
import { getInvalidSignUpPhoneMessageForCountry } from "@/feature/auth/signUp/utils/signUpPhoneNumber.util";

describe("validateUserManagementMemberEditor", () => {
  it("returns inline errors for invalid create input", () => {
    const result = validateUserManagementMemberEditor({
      mode: "create",
      fullName: "",
      phoneCountryCode: "NP",
      phone: "123",
      password: "123",
      roleRemoteId: null,
    });

    expect(result).toEqual({
      fullName: "Full name must be at least 2 characters.",
      phone: getInvalidSignUpPhoneMessageForCountry("NP"),
      password: "Password must be at least 6 characters.",
      roleRemoteId: "Select a role for this staff member.",
    });
  });

  it("allows edit mode without password reset", () => {
    const result = validateUserManagementMemberEditor({
      mode: "edit",
      fullName: "Kapil Dhami",
      phoneCountryCode: "NP",
      phone: "9812345678",
      password: "",
      roleRemoteId: null,
    });

    expect(result).toEqual({});
  });

  it("returns password error in edit mode only when provided password is too short", () => {
    const result = validateUserManagementMemberEditor({
      mode: "edit",
      fullName: "Kapil Dhami",
      phoneCountryCode: "NP",
      phone: "9812345678",
      password: "123",
      roleRemoteId: null,
    });

    expect(result).toEqual({
      password: "Password must be at least 6 characters.",
    });
  });
});
