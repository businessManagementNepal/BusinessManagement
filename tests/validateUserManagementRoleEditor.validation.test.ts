import { describe, expect, it } from "vitest";
import { validateUserManagementRoleEditor } from "@/feature/userManagement/validation/validateUserManagementRoleEditor";

describe("validateUserManagementRoleEditor", () => {
  it("returns inline error for blank role name", () => {
    const result = validateUserManagementRoleEditor({
      roleName: " ",
    });

    expect(result).toEqual({
      roleName: "Role name must be at least 2 characters.",
    });
  });

  it("passes valid role name", () => {
    const result = validateUserManagementRoleEditor({
      roleName: "Manager",
    });

    expect(result).toEqual({});
  });
});
