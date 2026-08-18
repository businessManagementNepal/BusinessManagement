import { describe, expect, it } from "vitest";
import { validatePersonalProfileFields } from "@/feature/profile/screen/validation/validatePersonalProfileFields";

const createProfile = () => ({
  fullName: "Kapil Shrestha",
  phone: "+977 9812345678",
  email: "kapil@example.com",
  profileImageUrl: "",
});

describe("validatePersonalProfileFields", () => {
  it("requires a full name with at least two characters", () => {
    expect(
      validatePersonalProfileFields({ ...createProfile(), fullName: " " }),
    ).toEqual({ fullName: "Full name is required." });

    expect(
      validatePersonalProfileFields({ ...createProfile(), fullName: "K" }),
    ).toEqual({
      fullName: "Full name must be at least 2 characters.",
    });
  });

  it("validates non-empty phone and email values", () => {
    expect(
      validatePersonalProfileFields({
        ...createProfile(),
        phone: "invalid",
        email: "kapil@invalid",
      }),
    ).toEqual({
      phone: "Phone number is invalid.",
      email: "Email address is invalid.",
    });
  });

  it("allows optional phone and email values to be empty", () => {
    expect(
      validatePersonalProfileFields({
        ...createProfile(),
        phone: "",
        email: "",
      }),
    ).toEqual({});
  });
});
