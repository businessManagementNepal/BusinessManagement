import {
  USER_MANAGEMENT_PERMISSION_SEED,
} from "@/feature/userManagement/types/userManagementPermissionSeed.types";
import {
  USER_MANAGEMENT_DEFAULT_ROLE_TEMPLATES,
} from "@/feature/userManagement/types/userManagementDefaultRoles.shared";
import { describe, expect, it } from "vitest";

describe("userManagement report permissions", () => {
  it("seeds reports.export permission", () => {
    expect(
      USER_MANAGEMENT_PERMISSION_SEED.some(
        (permission) => permission.code === "reports.export",
      ),
    ).toBe(true);
  });

  it("grants reports.export to manager and accountant only", () => {
    const manager = USER_MANAGEMENT_DEFAULT_ROLE_TEMPLATES.find(
      (role) => role.slug === "manager",
    );
    const accountant = USER_MANAGEMENT_DEFAULT_ROLE_TEMPLATES.find(
      (role) => role.slug === "accountant",
    );
    const counter = USER_MANAGEMENT_DEFAULT_ROLE_TEMPLATES.find(
      (role) => role.slug === "counter",
    );
    const sales = USER_MANAGEMENT_DEFAULT_ROLE_TEMPLATES.find(
      (role) => role.slug === "sales",
    );

    expect(manager?.permissionCodes).toContain("reports.export");
    expect(accountant?.permissionCodes).toContain("reports.export");
    expect(counter?.permissionCodes).not.toContain("reports.export");
    expect(sales?.permissionCodes).not.toContain("reports.export");
  });
});
