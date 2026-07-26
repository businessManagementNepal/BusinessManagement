import { describe, expect, it } from "vitest";
import {
  loginFormSchema,
  loginInputSchema,
} from "@/feature/auth/login/validation/login.schema";

describe("login.schema", () => {
  it("keeps the raw password when normalizing login input", () => {
    const result = loginInputSchema.safeParse({
      phoneNumber: "+9779812345678",
      password: "  secret123  ",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.password).toBe("  secret123  ");
  });

  it("validates phone digits against the selected country rules", () => {
    const result = loginFormSchema.safeParse({
      phoneCountryCode: "NP",
      phoneNumber: "12345",
      password: "secret123",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.path).toEqual(["phoneNumber"]);
  });
});
