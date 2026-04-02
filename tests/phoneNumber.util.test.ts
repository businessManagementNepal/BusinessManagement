import { describe, expect, it } from "vitest";
import {
  buildPhoneLoginIdCandidates,
  normalizeE164PhoneNumber,
} from "@/shared/utils/auth/phoneNumber.util";

describe("phoneNumber.util", () => {
  it("normalizes valid strict E.164 values", () => {
    expect(normalizeE164PhoneNumber(" +977-9812345678 ")).toBe(
      "+9779812345678",
    );
  });

  it("rejects non-E.164 values", () => {
    expect(normalizeE164PhoneNumber("9812345678")).toBe("");
    expect(normalizeE164PhoneNumber("+0123456789")).toBe("");
  });

  it("builds fallback login-id candidates for supported country codes", () => {
    expect(buildPhoneLoginIdCandidates("+919876543210")).toEqual([
      "+919876543210",
      "9876543210",
    ]);
    expect(buildPhoneLoginIdCandidates("+9779812345678")).toEqual([
      "+9779812345678",
      "9812345678",
    ]);
    expect(buildPhoneLoginIdCandidates("9876543210")).toEqual([]);
  });
});
