import { describe, expect, it } from "vitest";
import { validateBusinessProfileFields } from "@/feature/profile/business/validation/validateBusinessProfileFields";

describe("validateBusinessProfileFields", () => {
  it("returns inline errors for missing required fields", () => {
    const result = validateBusinessProfileFields({
      legalBusinessName: "",
      businessType: "",
      businessPhone: "",
      businessEmail: "",
      registeredAddress: "",
      currencyCode: "",
      country: "",
    });

    expect(result).toEqual({
      legalBusinessName: "Legal business name is required.",
      businessType: "Business type is invalid.",
      businessPhone: "Business phone is required.",
      registeredAddress: "Registered or operating address is required.",
      currencyCode: "Currency is required.",
      country: "Country is required.",
    });
  });

  it("returns inline errors for invalid phone, email, and currency", () => {
    const result = validateBusinessProfileFields({
      legalBusinessName: "Trendpal",
      businessType: "Retail Store",
      businessPhone: "abc",
      businessEmail: "bad-email",
      registeredAddress: "Kathmandu",
      currencyCode: "NPRR",
      country: "Nepal",
    });

    expect(result).toEqual({
      businessPhone: "Business phone is invalid.",
      businessEmail: "Business email is invalid.",
      currencyCode: "Currency must be a 3-letter ISO code.",
    });
  });

  it("passes valid values and allows blank optional email", () => {
    const result = validateBusinessProfileFields({
      legalBusinessName: "Trendpal",
      businessType: "Retail Store",
      businessPhone: "+977 9812345678",
      businessEmail: "",
      registeredAddress: "Kathmandu-1, Nepal",
      currencyCode: "NPR",
      country: "Nepal",
    });

    expect(result).toEqual({});
  });
});
